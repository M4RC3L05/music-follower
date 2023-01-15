import fs from "node:fs/promises";

import { db } from "#src/database/mod.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("migrations");

export const run = async () => {
  const dirFiles = await fs.readdir("./src/database/core/migrations", { withFileTypes: true });
  const migrationsFiles = dirFiles.filter((file) => file.isFile() && file.name.endsWith(".sql"));
  const migrations = await Promise.all(
    migrationsFiles.map((file) => async () => {
      db.exec(await fs.readFile(`./src/database/core/migrations/${file.name}`, { encoding: "utf8" }));
    }),
  );

  log.info("Running migrations");

  await db.migrate(...migrations);

  log.info("Migrations runned");
};
