import fs from "node:fs/promises";
import { Model } from "objection";

import { knex } from "#src/core/clients/knex.js";
import { makeLogger } from "#src/core/clients/logger.js";
import { artistRepository } from "#src/entities/artist/repositories/artist-repository.js";

Model.knex(knex);

const logger = makeLogger("update-artists-command");

try {
  await fs.stat("./database/data/artists.json");
} catch {
  await fs.writeFile("./database/data/artists.json", JSON.stringify([]), { encoding: "utf8" });
}

const data = JSON.parse(await fs.readFile("./database/data/artists.json", { encoding: "utf8" })) as Array<{
  id: number;
  name: string;
  imageUrl: string;
}>;

if (data.length > 0) {
  try {
    const updateResult = await artistRepository.syncArtists(data);

    logger.info({ updateResult: updateResult.length }, "Artists updated.");
  } catch (error: unknown) {
    logger.error(error, "Could not update artists.");
  }
}

await knex.destroy();
