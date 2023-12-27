/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-await-in-loop */

import { setTimeout } from "node:timers/promises";

import sql, { type Database } from "@leafac/sqlite";
import config from "config";
import ms from "ms";

import { makeLogger } from "#src/common/logger/mod.js";
import { type Artist, type Release } from "#src/database/mod.js";
import {
  type ItunesLookupAlbumModel,
  type ItunesLookupSongModel,
  itunesRequests,
} from "#src/remote/mod.js";

const log = makeLogger("task");

enum ErrorCodes {
  SONG_AND_ALBUM_RELEASES_REQUEST_FAILED = "SONG_AND_ALBUM_RELEASES_REQUEST_FAILED",
  NO_RELEASES_FOUND = "NO_RELEASES_FOUND",
}

const usableRelease = (
  artist: Artist,
  release: ItunesLookupAlbumModel | ItunesLookupSongModel,
) => {
  const isInThePastYears =
    new Date(release.releaseDate) <
    new Date(
      Date.now() -
        ms(config.get<string>("apps.jobs.sync-releases.max-release-time")),
    );
  let isCompilation = release.artistName
    ?.toLowerCase?.()
    ?.includes?.("Various Artists".toLowerCase());

  if (release.wrapperType === "track" && release.collectionArtistName) {
    isCompilation =
      isCompilation &&
      release.collectionArtistName
        ?.toLowerCase?.()
        ?.includes?.("Various Artists".toLowerCase());
  }

  const isDjMix =
    release.collectionName
      ?.toLowerCase?.()
      ?.includes?.("(DJ Mix)".toLowerCase()) ||
    release.collectionCensoredName
      ?.toLowerCase?.()
      ?.includes?.("(DJ Mix)".toLowerCase());

  return !isInThePastYears && !isCompilation && !isDjMix;
};

const getRelases = async (artist: Artist, signal?: AbortSignal) => {
  let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

  const [songsResult, albumsResult] = await Promise.allSettled([
    itunesRequests.getLatestReleasesByArtist(artist.id, "song", signal),
    itunesRequests.getLatestReleasesByArtist(artist.id, "album", signal),
  ]);

  if (songsResult.status === "rejected" && albumsResult.status === "rejected") {
    throw new Error("Releases request failed", {
      cause: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        albumsCause: albumsResult.reason,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        songsCause: songsResult.reason,
        code: ErrorCodes.SONG_AND_ALBUM_RELEASES_REQUEST_FAILED,
      },
    });
  }

  if (albumsResult.status === "fulfilled") {
    results = [
      ...results,
      ...albumsResult.value.results.filter((release) =>
        usableRelease(artist, release),
      ),
    ];
  }

  if (songsResult.status === "fulfilled") {
    results = [
      ...results,
      ...songsResult.value.results.filter((release) =>
        usableRelease(artist, release),
      ),
    ];
  }

  if (!results || results.length <= 0) {
    throw new Error("No releases", {
      cause: { code: ErrorCodes.NO_RELEASES_FOUND },
    });
  }

  return results;
};

export const syncReleases =
  (db: Database) =>
  (
    releases: Array<
      Omit<Release, "feedAt"> & {
        collectionId?: number;
        isStreamable?: boolean;
        feedAt?: string;
      }
    >,
    options?: { noHiddenOverride: boolean },
  ) => {
    for (const { collectionId, isStreamable, ...release } of releases) {
      const storedRelease = db.get<Release>(sql`
        select *
        from releases
        where id = ${release.id}
        and   type = ${release.type}
        limit 1;
      `);

      // Do not override currently setted hidden status
      if (storedRelease && options?.noHiddenOverride) {
        release.hidden = storedRelease.hidden;
      }

      // Determine the feed position, defaults to using provided `feedAt`.
      // If the collection/track is a pre-release (the releasedAt is an upcomming date) we use the releasedAt,
      // this way we maintain the order of the release in the feed.
      // If it was released, we set the current date, this way, it will appear in the feed in the reverse order as the releases were processed,
      // the last release being processed will be the first in the list and so on.
      release.feedAt =
        release.feedAt ??
        storedRelease?.feedAt ??
        (new Date(release.releasedAt).getTime() > Date.now()
          ? new Date(release.releasedAt)
          : new Date()
        ).toISOString();

      // If for some reason the track has an invalid date (most likely there was no releasedAt in the first place)
      // we set its as the current date or the one in the db if the release was already stored, since we can stream it.
      if (Number.isNaN(new Date(release.releasedAt).getTime())) {
        release.releasedAt =
          storedRelease?.releasedAt ?? new Date().toISOString();
      }

      if (release.type === "collection") {
        log.debug({ id: release.id, type: release.type }, "Upserting release");

        db.execute(sql`
          insert or replace into releases
            (id, "artistName", name, "releasedAt", "coverUrl", type, hidden, metadata, "feedAt")
          values
            (${release.id}, ${release.artistName}, ${release.name}, ${release.releasedAt}, ${release.coverUrl}, ${release.type}, ${release.hidden}, ${release.metadata}, ${release.feedAt})
        `);

        continue;
      }

      if (!isStreamable) {
        log.debug({ id: release.id }, "Release is not streamable, ignoring");

        continue;
      }

      // This is for music releases that are a part of an album that is
      // yet to be releases but some songs are already available.
      const album = db.get<Release>(sql`
        select * from releases
        where id = ${collectionId}
        and   type = 'collection'
        limit 1;
      `);

      // Ignore tracks that we do not have an album to.
      // Must likely a track belonging in a mix or compilation.
      // At least we have the collection (album) that represents the single.
      if (!album) {
        continue;
      }

      // If we have an album and the album was already released we return
      if (new Date(album.releasedAt) <= new Date()) {
        log.debug(
          { id: release.id },
          "The album that contains the current track release, was already released, ignoring",
        );

        continue;
      }

      log.debug({ id: release.id, type: release.type }, "Upserting release");

      db.execute(sql`
        insert or replace into releases
          (id, "artistName", name, "releasedAt", "coverUrl", type, hidden, metadata, "feedAt")
        values
          (${release.id}, ${release.artistName}, ${release.name}, ${release.releasedAt}, ${release.coverUrl}, ${release.type}, ${release.hidden}, ${release.metadata}, ${release.feedAt})
      `);
    }
  };

export const run = (db: Database) => async (abort: AbortSignal) => {
  if (abort.aborted) {
    return;
  }

  log.info("Begin releases sync.");

  const mappedSyncReleases = syncReleases(db);
  const artists = db.all<Artist>(sql`select * from artists;`);
  const size = db.get<{ total: string }>(
    sql`select count(id) as total from artists`,
  );

  if (!size) {
    throw new Error("Could not get size of artists");
  }

  const total = Number(size.total);

  for (const [key, artist] of artists.entries()) {
    if (abort.aborted) {
      break;
    }

    log.info(
      `Processing releases from "${artist.name}" at ${key + 1} of ${total}.`,
    );

    let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

    try {
      results = await getRelases(artist, abort);
    } catch (error: unknown) {
      switch (((error as Error).cause as { code?: ErrorCodes }).code) {
        case ErrorCodes.SONG_AND_ALBUM_RELEASES_REQUEST_FAILED: {
          const { albumsCause, songsCause } = (error as Error).cause as {
            albumsCause: unknown;
            songsCause: unknown;
          };
          log.error(error, "Could not get releases");
          log.error(songsCause, "Could not get song releases");
          log.error(albumsCause, "Could not get album releases");
          log.info("Waiting 5 seconds before processing next artist");

          await setTimeout(5000, undefined, { signal: abort }).catch(() => {});
          continue;
        }

        case ErrorCodes.NO_RELEASES_FOUND: {
          log.warn(error, "No remote data found.");
          log.info("Waiting 5 seconds before processing next artist");

          await setTimeout(5000, undefined, { signal: abort }).catch(() => {});
          continue;
        }

        default: {
          log.error(error, "Something went wrong fetching releases");
        }
      }
    }

    if (abort.aborted) {
      break;
    }

    const releases = results.map((data) => {
      const entity: Omit<Release, "feedAt"> & { feedAt?: string } = {
        id:
          data.wrapperType === "collection" ? data.collectionId : data.trackId,
        name:
          data.wrapperType === "collection"
            ? data.collectionName
            : data.trackName,
        type: data.wrapperType,
        hidden: JSON.stringify([]),
        artistName: data.artistName,
        releasedAt: data.releaseDate,
        coverUrl: data.artworkUrl100
          .split("/")
          .map((segment, index, array) =>
            index === array.length - 1 ? "512x512bb.jpg" : segment,
          )
          .join("/"),
        metadata: JSON.stringify({ ...data }),
      };

      return {
        ...entity,
        collectionId: data.collectionId,
        isStreamable: (data as ItunesLookupSongModel).isStreamable || false,
      };
    });

    log.info(
      {
        releases: releases.map(
          ({ name, artistName }) => `${name} by ${artistName}`,
        ),
        id: artist.id,
      },
      "Usable releases",
    );

    try {
      log.info({ id: artist.id }, "Upserting releases for artist");

      db.executeTransaction(() => {
        // We process albums first so that we can then check if we should include tracks,
        // that are already available but belong to a album that is yet to be released.
        mappedSyncReleases(
          releases.filter(({ type }) => type === "collection"),
          { noHiddenOverride: true },
        );
        mappedSyncReleases(
          releases.filter(({ type }) => type === "track"),
          { noHiddenOverride: true },
        );
      });
    } catch (error: unknown) {
      log.error(error, "Something wrong ocurred while upserting releases");
    }

    if (abort.aborted) {
      break;
    }

    log.info("Waiting 5 seconds before processing next artist");

    await setTimeout(5000, undefined, { signal: abort }).catch(() => {});
  }

  log.info("Releases sync ended.");
};
