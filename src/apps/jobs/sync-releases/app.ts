import config from "config";
import ms from "ms";
import { makeLogger } from "#src/common/logger/mod.ts";
import type { Artist, Release } from "#src/database/types/mod.ts";
import {
  type ItunesLookupAlbumModel,
  type ItunesLookupSongModel,
  itunesRequests,
} from "#src/remote/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";
import { delay } from "@std/async";

const log = makeLogger("sync-releases-job");
const notBefore = new Date(
  Date.now() -
    ms(config.get<string>("apps.jobs.sync-releases.max-release-time")),
);

enum ErrorCodes {
  SONG_AND_ALBUM_RELEASES_REQUEST_FAILED =
    "SONG_AND_ALBUM_RELEASES_REQUEST_FAILED",
  NO_RELEASES_FOUND = "NO_RELEASES_FOUND",
}

const usableRelease = (
  release: ItunesLookupAlbumModel | ItunesLookupSongModel,
) => {
  const isToOLd = new Date(release.releaseDate) < notBefore;

  const isCompilation =
    (release.wrapperType === "track"
      ? (release as ItunesLookupSongModel).collectionArtistName
      : release.artistName)
      ?.toLowerCase?.()
      ?.includes?.("Various Artists".toLowerCase());

  const isDjMix = release.collectionName?.toLowerCase?.()
    ?.includes?.("DJ Mix".toLowerCase()) ||
    release.collectionCensoredName?.toLowerCase?.()
      ?.includes?.("DJ Mix".toLowerCase());

  return !isToOLd && !isCompilation && !isDjMix;
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
        albumsCause: albumsResult.reason,
        songsCause: songsResult.reason,
        code: ErrorCodes.SONG_AND_ALBUM_RELEASES_REQUEST_FAILED,
      },
    });
  }

  if (albumsResult.status === "fulfilled") {
    results = [
      ...results,
      ...albumsResult.value.results.filter((release) => usableRelease(release)),
    ];
  }

  if (songsResult.status === "fulfilled") {
    results = [
      ...results,
      ...songsResult.value.results.filter((release) => usableRelease(release)),
    ];
  }

  if (!results || results.length <= 0) {
    throw new Error("No releases", {
      cause: { code: ErrorCodes.NO_RELEASES_FOUND },
    });
  }

  return results;
};

const insertOrReplaceRelease = (db: CustomDatabase, release: Release) => {
  return db.sql`
    insert or replace into releases 
      (id, "artistName", name, "releasedAt", "coverUrl", type, hidden, metadata, "feedAt")
    values
      (
        ${release.id},
        ${release.artistName},
        ${release.name},
        ${release.releasedAt},
        ${release.coverUrl},
        ${release.type},
        ${release.hidden},
        ${release.metadata},
        ${release.feedAt}
      )
`;
};

const syncReleases = (
  db: CustomDatabase,
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
    const [storedRelease] = db.sql<Release>`
      select *
      from releases
      where id = ${release.id}
      and type = ${release.type}
      limit 1;
    `;

    // Do not override currently setted hidden status
    if (storedRelease && options?.noHiddenOverride) {
      release.hidden = storedRelease.hidden;
    }

    // If for some reason the track has an invalid date (most likely there was no releasedAt in the first place)
    // we set its as the current date or the one in the db if the release was already stored, since we can stream it.
    if (Number.isNaN(new Date(release.releasedAt).getTime())) {
      release.releasedAt = storedRelease?.releasedAt ??
        new Date().toISOString();
    }

    // Only use releasedAt if it is a date in the future
    release.feedAt ??= !Number.isNaN(new Date(release.releasedAt).getTime())
      ? new Date(release.releasedAt) > new Date()
        ? new Date(release.releasedAt).toISOString()
        : new Date().toISOString()
      : new Date().toISOString();

    if (release.type === "collection") {
      insertOrReplaceRelease(db, release as Release);

      continue;
    }

    if (!isStreamable) {
      log.info("Release is not streamable, ignoring", { id: release.id });

      continue;
    }

    // This is for music releases that are a part of an album that is
    // yet to be releases but some songs are already available.
    const [album] = db.sql<Release>`
      select * from releases
      where id = ${collectionId}
      and type = 'collection'
      limit 1;
    `;

    // Ignore tracks that we do not have an album to.
    // Must likely a track belonging in a mix or compilation.
    // At least we should have the collection (album) that represents the single.
    if (!album) {
      log.info("Track does not have a previous saved album, ignoring", {
        id: release.id,
      });

      continue;
    }

    // If we have an album and the album was already released we return
    if (new Date(album.releasedAt) <= new Date()) {
      log.info(
        "The album that contains the current track release, was already released, ignoring",
        { id: release.id, albumId: album.id },
      );

      continue;
    }

    insertOrReplaceRelease(db, release as Release);
  }
};

const runner = async ({
  db,
  abort,
}: { db: CustomDatabase; abort: AbortSignal }) => {
  if (abort.aborted) {
    return;
  }

  log.info("Begin releases sync");

  const artists = db.prepare(`
      select *, row_number() over (order by id) as "index", ti."totalItems" as "totalItems"
      from 
        artists,
        (select count(id) as "totalItems" from artists) as ti
      order by id;
    `)
    .iter() as IterableIterator<Artist & { index: number; totalItems: number }>;

  for (const artist of artists) {
    const isLastArtist = artist.index >= artist.totalItems;

    if (abort.aborted) {
      break;
    }

    log.info(
      `Processing releases from "${artist.name}" at ${artist.index} of ${artist.totalItems}`,
    );

    let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

    try {
      results = await getRelases(artist, abort);
    } catch (error: unknown) {
      switch (((error as Error).cause as { code?: ErrorCodes }).code) {
        case ErrorCodes.SONG_AND_ALBUM_RELEASES_REQUEST_FAILED: {
          log.error("Could not get releases", { error });

          if (!isLastArtist) {
            log.info("Waiting 5 seconds before processing next artist");

            await delay(5000, { signal: abort }).catch(() => {});
          }

          continue;
        }

        case ErrorCodes.NO_RELEASES_FOUND: {
          log.warn("No remote data found", { error });

          if (!isLastArtist) {
            log.info("Waiting 5 seconds before processing next artist");

            await delay(5000, { signal: abort }).catch(() => {});
          }

          continue;
        }

        default: {
          log.error("Something went wrong fetching releases", { error });
        }
      }
    }

    if (abort.aborted) {
      break;
    }

    const releases = results.map((data) => {
      const entity: Omit<Release, "feedAt"> & { feedAt?: string } = {
        id: data.wrapperType === "collection"
          ? data.collectionId
          : data.trackId,
        name: data.wrapperType === "collection"
          ? data.collectionName
          : data.trackName,
        type: data.wrapperType,
        hidden: JSON.stringify([]),
        artistName: data.artistName,
        releasedAt: data.releaseDate,
        coverUrl: data.artworkUrl100
          .split("/")
          .map((segment, index, array) =>
            index === array.length - 1 ? "512x512bb.jpg" : segment
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
      "Usable releases",
      {
        releases: releases.map(
          ({ name, artistName }) => `${name} by ${artistName}`,
        ),
        id: artist.id,
      },
    );

    try {
      log.info("Upserting releases for artist", { id: artist.id });

      db.transaction(() => {
        // We process albums first so that we can then check if we should include tracks,
        // that are already available but belong to a album that is yet to be released.
        syncReleases(db, releases.filter(({ type }) => type === "collection"), {
          noHiddenOverride: true,
        });
        syncReleases(db, releases.filter(({ type }) => type === "track"), {
          noHiddenOverride: true,
        });
      }).immediate();
    } catch (error: unknown) {
      log.error("Something wrong ocurred while upserting releases", { error });
    }

    if (!isLastArtist) {
      log.info("Waiting 5 seconds before processing next artist");

      await delay(5000, { signal: abort }).catch(() => {});
    }
  }

  log.info("Releases sync ended");
};

export default runner;
