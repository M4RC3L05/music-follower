/* eslint-disable no-await-in-loop */

import { makeLogger } from "#src/core/clients/logger.js";
import fetch from "node-fetch";
import { setTimeout } from "node:timers/promises";
import config from "config";
import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";
import { artistRepository } from "#src/entities/artist/repositories/artist-repository.js";

const logger = makeLogger("sync-releases-command");

export const run = async () => {
  logger.info("Begin releases sync.");

  const artists = await artistRepository.getArtists();
  const { albums, songs } = config.get<{ albums: string; songs: string }>("releases");

  for (const [key, artist] of artists.entries()) {
    logger.info(`Processing releases from "${artist.name}" at ${key + 1} of ${artists.length}.`);

    let results: Array<{
      collectionId: number;
      trackName: string;
      artistName: string;
      collectionName: string;
      artworkUrl100: string;
      releaseDate?: string;
      trackId: number;
      isStreamable: boolean;
      wrapperType: "track" | "collection";
    }>;

    try {
      const [albumsResponse, songsResponse] = await Promise.all([
        fetch(albums.replaceAll("{{id}}", `${artist.id}`)),
        fetch(songs.replaceAll("{{id}}", `${artist.id}`)),
      ]);

      if (!albumsResponse.ok && !songsResponse.ok) {
        logger.error(
          { albumsStatusCode: albumsResponse.status, songsStatusCode: songsResponse.status },
          "Could not get albums and songs as the request has failed for both.",
        );
        logger.info("Waiting 5 seconds before processing next artist");

        await setTimeout(5000);
        continue;
      }

      results = [];

      if (albumsResponse.ok) {
        const { results: albums } = (await albumsResponse.json()) as any;

        albums.splice(0, 1);
        results = [...results, ...albums];
      }

      if (songsResponse.ok) {
        const { results: songs } = (await songsResponse.json()) as any;

        songs.splice(0, 1);
        results = [...results, ...songs];
      }

      results = results.filter(({ releaseDate, wrapperType }, _, data) => {
        if (typeof releaseDate === "string") {
          return new Date(releaseDate).getUTCFullYear() === new Date().getUTCFullYear();
        }

        if (wrapperType === "track" && (releaseDate === undefined || releaseDate === undefined)) {
          return true;
        }

        return false;
      });
    } catch (error: unknown) {
      logger.error(error, "Something went wrong fetching releases.");
      logger.info("Waiting 5 seconds before processing next artist");

      await setTimeout(5000);
      continue;
    }

    if (!results || results.length <= 0) {
      logger.info("No remote data found.");
      logger.info("Waiting 5 seconds before processing next artist");

      await setTimeout(5000);
      continue;
    }

    const releases = results.map(
      ({
        trackName,
        wrapperType,
        isStreamable,
        artistName,
        trackId,
        artworkUrl100,
        collectionId,
        collectionName,
        releaseDate,
      }) => ({
        id: wrapperType === "collection" ? collectionId : trackId,
        collectionId,
        isStreamable,
        name: wrapperType === "collection" ? collectionName : trackName,
        type: wrapperType,
        artistName,
        releasedAt: releaseDate ? new Date(releaseDate) : undefined,
        coverUrl: artworkUrl100
          .split("/")
          .map((segment, index, array) => (index === array.length - 1 ? "640x640bb.jpg" : segment))
          .join("/"),
      }),
    );

    if (releases.length <= 0) {
      logger.info("Waiting 5 seconds before processing next artist");

      await setTimeout(5000);
      continue;
    }

    logger.info({ releases: releases.map(({ name, artistName }) => `${name} by ${artistName}`) }, "Usable releases.");

    try {
      // We process albums first so that we can then check if we should include tracks,
      // that are already available but belong to a album that is yet to be released.
      await releaseRepository.upsertReleases(releases.filter(({ type }) => type === "collection"));
      await releaseRepository.upsertReleases(releases.filter(({ type }) => type === "track"));
    } catch (error: unknown) {
      logger.error(error, "Something wrong ocurred while upserting releases");
    }

    logger.info("Waiting 5 seconds before processing next artist");
    await setTimeout(5000);
  }

  logger.info("Releases sync ended.");
};
