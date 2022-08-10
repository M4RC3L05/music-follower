/* eslint-disable no-await-in-loop */

import { knex } from "#src/core/clients/knex.js";
import { makeLogger } from "#src/core/clients/logger.js";
import fetch from "node-fetch";
import { setTimeout } from "node:timers/promises";
import config from "config";
import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";
import { Model } from "objection";
import { artistRepository } from "#src/entities/artist/repositories/artist-repository.js";

Model.knex(knex);

const logger = makeLogger("sync-releases-command");

export const run = async () => {
  logger.info("Begin releases sync.");

  const artists = await artistRepository.getArtists();

  for (const [key, artist] of artists.entries()) {
    logger.info(`Processing releases from "${artist.name}" at ${key + 1} of ${artists.length}.`);

    let results: Array<{
      collectionId: number;
      artistName: string;
      collectionName: string;
      artworkUrl100: string;
      releaseDate: string;
    }>;

    try {
      const response = await fetch(config.get<string>("releases.sourceUrl").replaceAll("{{id}}", `${artist.id}`));

      if (!response.ok) {
        throw new Error(`Response error with ${response.status} code`);
      }

      results = ((await response.json()) as any).results;
      results.splice(0, 1);
      results = results.filter(
        ({ releaseDate }) => new Date(releaseDate).getUTCFullYear() === new Date().getUTCFullYear(),
      );
    } catch (error: unknown) {
      logger.error(error, "Something went wrong fetching releases.");

      await setTimeout(5000);
      continue;
    }

    const releases = results.map(({ artistName, artworkUrl100, collectionId, collectionName, releaseDate }) => ({
      id: collectionId,
      name: collectionName,
      artistName,
      releasedAt: new Date(releaseDate),
      coverUrl: artworkUrl100
        .split("/")
        .map((segment, index, array) => (index === array.length - 1 ? "640x640bb.jpg" : segment))
        .join("/"),
    }));

    if (releases.length <= 0) {
      await setTimeout(5000);
      continue;
    }

    logger.info({ releases: releases.map(({ name, artistName }) => `${name} by ${artistName}`) }, "Usable releases.");

    try {
      await releaseRepository.upsertReleases(releases);
    } catch (error: unknown) {
      logger.error(error, "Something wrong ocurred while upserting releases");
    }

    await setTimeout(5000);
  }

  logger.info("Releases sync ended.");
};
