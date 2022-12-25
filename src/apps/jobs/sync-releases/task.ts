/* eslint-disable no-await-in-loop */

import timers from "node:timers/promises";

import type { ModelObject } from "objection";

import makeLogger from "#src/core/clients/logger.js";
import artistRepository from "#src/data/artist/repositories/artist-repository.js";
import type { ItunesLookupAlbumModel } from "#src/data/itunes/models/itunes-lookup-album-model.js";
import type { ItunesLookupSongModel } from "#src/data/itunes/models/itunes-lookup-song-model.js";
import type { ItunesResponseModel } from "#src/data/itunes/models/itunes-response-model.js";
import itunesLookupRepository from "#src/data/itunes/repositories/itunes-lookup-repository.js";
import type { ReleaseModel } from "#src/data/release/models/release-model.js";
import releaseRepository from "#src/data/release/repositories/release-repository.js";

const log = makeLogger(import.meta.url);

const enum ErrorCodes {
  SONG_AND_ALBUM_RELEASES_REQUEST_FAILED = "SONG_AND_ALBUM_RELEASES_REQUEST_FAILED",
  NO_RELEASES_FOUND = "NO_RELEASES_FOUND",
}

function usableRelease(release: ItunesLookupAlbumModel | ItunesLookupSongModel) {
  const isInThePastYears =
    typeof release.releaseDate === "string" &&
    new Date(release.releaseDate).getUTCFullYear() < new Date().getUTCFullYear();
  const isCompilation =
    release.wrapperType === "track" &&
    typeof release.collectionArtistName === "string" &&
    release.collectionArtistName?.toLowerCase().includes("Various Artists".toLowerCase());

  return !isInThePastYears && !isCompilation;
}

async function getRelases(artistId: number) {
  let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

  const [songsResult, albumsResult] = await itunesLookupRepository.getAllLatestReleasesFromArtist(artistId);

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
}

export async function run() {
  log.info("Begin releases sync.");

  const artists = await artistRepository.getArtists();

  for (const [key, artist] of artists.entries()) {
    log.info(`Processing releases from "${artist.name}" at ${key + 1} of ${artists.length}.`);

    let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

    try {
      results = await getRelases(artist.id);
    } catch (error: unknown) {
      if (!(error instanceof Error) || !(error?.cause as any).code) {
        log.error(error, "Someting went wrong while fetching releases");
        log.info("Waiting 5 seconds before processing next artist");

        await timers.setTimeout(5000);
      }

      switch ((((error as Error).cause ?? {}) as { code?: ErrorCodes }).code) {
        case ErrorCodes.SONG_AND_ALBUM_RELEASES_REQUEST_FAILED: {
          const { albumsCause, songsCause } = (error as Error).cause as { albumsCause: unknown; songsCause: unknown };

          log.error({ albumsCause, songsCause }, "Could not get albums and songs as the request has failed for both.");
          log.info("Waiting 5 seconds before processing next artist");

          await timers.setTimeout(5000);
          continue;
        }

        case ErrorCodes.NO_RELEASES_FOUND: {
          log.info("No remote data found.");
          log.info("Waiting 5 seconds before processing next artist");

          await timers.setTimeout(5000);
          continue;
        }

        default:
      }
    }

    const releases = results.map((data) => ({
      id: data.wrapperType === "collection" ? data.collectionId : data.trackId,
      collectionId: data.collectionId,
      isStreamable: (data as ItunesLookupSongModel).isStreamable || false,
      name: data.wrapperType === "collection" ? data.collectionName : data.trackName,
      type: data.wrapperType,
      artistName: data.artistName,
      releasedAt: data.releaseDate ? new Date(data.releaseDate) : undefined,
      coverUrl: data.artworkUrl100
        .split("/")
        .map((segment, index, array) => (index === array.length - 1 ? "512x512bb.jpg" : segment))
        .join("/"),
      metadata: { ...data },
    }));

    log.info({ releases: releases.map(({ name, artistName }) => `${name} by ${artistName}`) }, "Usable releases.");

    try {
      // We process albums first so that we can then check if we should include tracks,
      // that are already available but belong to a album that is yet to be released.
      await releaseRepository.upsertReleases(
        artist.id,
        releases.filter(({ type }) => type === "collection") as Array<
          ModelObject<ReleaseModel & { collectionId?: number; isStreamable?: boolean }>
        >,
      );
      await releaseRepository.upsertReleases(
        artist.id,
        releases.filter(({ type }) => type === "track") as Array<
          ModelObject<ReleaseModel & { collectionId?: number; isStreamable?: boolean }>
        >,
      );
    } catch (error: unknown) {
      log.error(error, "Something wrong ocurred while upserting releases");
    }

    log.info("Waiting 5 seconds before processing next artist");
    await timers.setTimeout(5000);
  }

  log.info("Releases sync ended.");
}
