import sql from "@leafac/sqlite";

import { db } from "#src/database/mod.js";
import { run } from "#src/commands/migrate.js";

export const migrate = async () => {
  await run();
};

export const cleanup = () => {
  db.execute(sql`DELETE FROM artists;`);
  db.execute(sql`DELETE FROM releases;`);
  db.execute(sql`VACUUM;`);
};
