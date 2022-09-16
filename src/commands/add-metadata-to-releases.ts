/* eslint-disable no-await-in-loop */
import { setTimeout } from "node:timers/promises";

import fetch from "node-fetch";
import { Model } from "objection";

import { knex } from "#src/core/clients/knex.js";
import { makeLogger } from "#src/core/clients/logger.js";
import { ReleaseModel } from "#src/entities/release/models/release-model.js";
import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";

Model.knex(knex);

const logger = makeLogger("add-metadata-to-releases");
const releases = await ReleaseModel.query().where({ metadata: "{}" });

for (const [index, release] of releases.entries()) {
  logger.info({ release }, `Processing release ${index + 1} of ${releases.length}`);

  const response = await fetch(`https://itunes.apple.com/lookup?limit=1&id=${release.id}`);
  if (!response.ok) {
    logger.error(
      {
        response: {
          status: response.status,
          statusText: response.statusText,
          type: response.type,
          url: response.url,
        },
        release,
      },
      "Could not get metadata from release",
    );

    await setTimeout(2000);
    continue;
  }

  const {
    results: [data],
  } = (await response.json()) as { results: Array<{ trackViewUrl: string; collectionViewUrl: string }> };

  await releaseRepository.updateRelease({ metadata: data as any }, release.id);
  await setTimeout(2000);
}

await knex.destroy();
