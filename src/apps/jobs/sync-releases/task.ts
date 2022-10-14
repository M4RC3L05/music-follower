/* eslint-disable no-await-in-loop */

import timers from "node:timers/promises";

import type { ModelObject } from "objection";

import makeLogger from "#src/core/clients/logger.js";
import artistRepository from "#src/data/artist/repositories/artist-repository.js";
import type { ItunesLookupAlbumModel } from "#src/data/itunes/models/itunes-lookup-album-model.js";
import type { ItunesLookupSongModel } from "#src/data/itunes/models/itunes-lookup-song-model.js";
import itunesLookupRepository from "#src/data/itunes/repositories/itunes-lookup-repository.js";
import type { ReleaseModel } from "#src/data/release/models/release-model.js";
import releaseRepository from "#src/data/release/repositories/release-repository.js";

const log = makeLogger(import.meta.url);

function usableRelease(release: ItunesLookupAlbumModel | ItunesLookupSongModel) {
  if (
    typeof release.releaseDate === "string" &&
    new Date(release.releaseDate).getUTCFullYear() < new Date().getUTCFullYear()
  ) {
    return false;
  }

  // Ignore compilations
  if (
    release.wrapperType === "track" &&
    typeof release.collectionArtistName === "string" &&
    release.collectionArtistName?.toLowerCase().includes("Various Artists".toLowerCase())
  ) {
    return false;
  }

  return true;
}

export async function run() {
  log.info("Begin releases sync.");

  const artists = await artistRepository.getArtists();

  for (const [key, artist] of artists.entries()) {
    log.info(`Processing releases from "${artist.name}" at ${key + 1} of ${artists.length}.`);

    let results: Array<ItunesLookupAlbumModel | ItunesLookupSongModel> = [];

    try {
      const [songsResult, albumsResult] = await itunesLookupRepository.getAllLatestReleasesFromArtist(artist.id);

      if (albumsResult.status === "rejected" && songsResult.status === "rejected") {
        log.error(
          { albumsCause: albumsResult.reason.cause, songsCause: songsResult.reason.cause },
          "Could not get albums and songs as the request has failed for both.",
        );
        log.info("Waiting 5 seconds before processing next artist");

        await timers.setTimeout(5000);
        continue;
      }

      if (albumsResult.status === "fulfilled") {
        results = [...results, ...albumsResult.value.results.filter((release) => usableRelease(release))];
      }

      if (songsResult.status === "fulfilled") {
        results = [
          ...results,
          // Ignore compilations
          ...songsResult.value.results.filter((release) => usableRelease(release)),
        ];
      }
    } catch (error: unknown) {
      log.error(error, "Something went wrong fetching releases");
      log.info("Waiting 5 seconds before processing next artist");

      await timers.setTimeout(5000);
      continue;
    }

    if (!results || results.length <= 0) {
      log.info("No remote data found.");
      log.info("Waiting 5 seconds before processing next artist");

      await timers.setTimeout(5000);
      continue;
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

    if (releases.length <= 0) {
      log.info("Waiting 5 seconds before processing next artist");

      await timers.setTimeout(5000);
      continue;
    }

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
