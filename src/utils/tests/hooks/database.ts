/* eslint-disable import/no-unassigned-import */

// To run the migrations on each memory db
import "#src/commands/migrations.js";

import sql from "@leafac/sqlite";

import { db } from "#src/database/db.js";

export const cleanup = () => {
  db.execute(sql`DELETE FROM artists;`);
  db.execute(sql`DELETE FROM releases;`);
  db.execute(sql`VACUUM;`);
};
