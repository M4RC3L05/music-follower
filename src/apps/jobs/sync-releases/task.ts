/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-await-in-loop */

import timers from "node:timers/promises";

import config from "config";
import ms from "ms";

import { type ItunesLookupAlbumModel, type ItunesLookupSongModel, itunesRequests } from "#src/remote/mod.js";
import { type Release, artistsQueries, releasesQueries } from "#src/database/mod.js";
import { db } from "#src/common/database/mod.js";
import { logger } from "#src/common/logger/mod.js";

const log = logger("task");

const enum ErrorCodes {
  SONG_AND_ALBUM_RELEASES_REQUEST_FAILED = "SONG_AND_ALBUM_RELEASES_REQUEST_FAILED",
  NO_RELEASES_FOUND = "NO_RELEASES_FOUND",
}

const usableRelease = (release: ItunesLookupAlbumModel | ItunesLookupSongModel) => {
  const isInThePastYears =
    new Date(release.releaseDate) <
    new Date(Date.now() - ms(config.get<string>("apps.jobs.sync-releases.max-release-time")));
  const isCompilation =
    release.wrapperType === "track" &&
    release.collectionArtistName?.toLowerCase?.()?.includes?.("Various Artists".toLowerCase());

  return !isInThePastYears && !isCompilation;
};

const getRelases = async (artistId: number, signal?: AbortSignal) => {
  let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

  const [songsResult, albumsResult] = await Promise.allSettled([
    itunesRequests.getLatestReleasesByArtist(artistId, "song", signal),
    itunesRequests.getLatestReleasesByArtist(artistId, "album", signal),
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
    results = [...results, ...albumsResult.value.results.filter((release) => usableRelease(release))];
  }

  if (songsResult.status === "fulfilled") {
    results = [...results, ...songsResult.value.results.filter((release) => usableRelease(release))];
  }

  if (!results || results.length <= 0) {
    throw new Error("No releases", { cause: { code: ErrorCodes.NO_RELEASES_FOUND } });
  }

  return results;
};

export const run = async (abort: AbortSignal) => {
  if (abort.aborted) {
    return;
  }

  log.info("Begin releases sync.");

  const artists = artistsQueries.getAll();

  for (const [key, artist] of artists.entries()) {
    if (abort.aborted) {
      break;
    }

    log.info(`Processing releases from "${artist.name}" at ${key + 1} of ${artists.length}.`);

    let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

    try {
      results = await getRelases(artist.id, abort);
    } catch (error: unknown) {
      switch (((error as Error).cause as { code?: ErrorCodes }).code) {
        case ErrorCodes.SONG_AND_ALBUM_RELEASES_REQUEST_FAILED: {
          const { albumsCause, songsCause } = (error as Error).cause as { albumsCause: unknown; songsCause: unknown };
          log.error(error, "Could not get releases");
          log.error(songsCause, "Could not get song releases");
          log.error(albumsCause, "Could not get album releases");
          log.info("Waiting 5 seconds before processing next artist");

          await timers.setTimeout(5000, undefined, { signal: abort }).catch(() => {});
          continue;
        }

        case ErrorCodes.NO_RELEASES_FOUND: {
          log.warn(error, "No remote data found.");
          log.info("Waiting 5 seconds before processing next artist");

          await timers.setTimeout(5000, undefined, { signal: abort }).catch(() => {});
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
      const entity: Omit<Release, "feedAt"> & { feedAt?: Date } = {
        id: data.wrapperType === "collection" ? data.collectionId : data.trackId,
        name: data.wrapperType === "collection" ? data.collectionName : data.trackName,
        type: data.wrapperType,
        hidden: [],
        artistName: data.artistName,
        releasedAt: new Date(data.releaseDate),
        coverUrl: data.artworkUrl100
          .split("/")
          .map((segment, index, array) => (index === array.length - 1 ? "512x512bb.jpg" : segment))
          .join("/"),
        metadata: { ...data },
      };

      return {
        ...entity,
        collectionId: data.collectionId,
        isStreamable: (data as ItunesLookupSongModel).isStreamable || false,
      };
    });

    log.info(
      { releases: releases.map(({ name, artistName }) => `${name} by ${artistName}`), id: artist.id },
      "Usable releases",
    );

    try {
      log.info({ id: artist.id }, "Upserting releases for artist");

      db.executeTransaction(() => {
        // We process albums first so that we can then check if we should include tracks,
        // that are already available but belong to a album that is yet to be released.
        releasesQueries.upsertMany(
          releases.filter(({ type }) => type === "collection"),
          { noHiddenOverride: true },
        );
        releasesQueries.upsertMany(
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

    await timers.setTimeout(5000, undefined, { signal: abort }).catch(() => {});
  }

  log.info("Releases sync ended.");
};
