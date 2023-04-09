import sql, { Database } from "@leafac/sqlite";
import config from "config";

import { addHook } from "#src/common/utils/process-utils.js";
import logger from "#src/common/clients/logger.js";

const log = logger("database");

const db = new Database(config.get("database.path"), {
  verbose(message, ...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    log.debug({ sql: message, args }, "Running sql");
  },
})
  .execute(sql`pragma journal_mode = WAL`)
  .execute(sql`pragma busy_timeout = 5000`)
  .execute(sql`pragma foreign_keys = ON`);

/* c8 ignore start */
addHook({
  handler() {
    db.close();

    log.info("Database connection closed");
  },
  name: "database",
});
/* c8 ignore stop */

export default db;