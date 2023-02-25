import fs from "node:fs/promises";

import db from "#src/common/clients/db.js";
import logger from "#src/common/clients/logger.js";

const log = logger("migrations");

export const run = async () => {
  const dirFiles = await fs.readdir("./src/common/database/migrations", { withFileTypes: true });
  const migrationsFiles = dirFiles.filter((file) => file.isFile() && file.name.endsWith(".sql"));
  const migrations = await Promise.all(
    migrationsFiles.map((file) => async () => {
      db.exec(await fs.readFile(`./src/common/database/migrations/${file.name}`, { encoding: "utf8" }));
    }),
  );

  log.info("Running migrations");

  await db.migrate(...migrations);

  log.info("Migrations runned");
};
