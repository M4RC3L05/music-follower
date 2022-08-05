import fs from "node:fs/promises";
import { knex } from "#src/core/clients/knex.js";
import { makeLogger } from "#src/core/clients/logger.js";

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
  const trx = await knex.transaction();

  try {
    await trx.delete().from("artists");
    const updateResult = await trx.insert(data).into("artists");
    await trx.commit();

    logger.info({ updateResult }, "Artists updated.");
  } catch (error: unknown) {
    await trx.rollback();

    logger.error(error, "Could not update artists.");
  } finally {
    await knex.destroy();
  }
}
