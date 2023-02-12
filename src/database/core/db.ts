import { Database } from "@leafac/sqlite";
import config from "config";

import { addHook } from "#src/utils/process/process.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("database");

export const db = new Database(config.get("database.path"), {
  verbose(message, ...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    log.debug({ sql: message, args }, "Running sql");
  },
});

db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

/* c8 ignore start */
addHook({
  handler() {
    db.close();

    log.info("Database connection closed");
  },
  name: "database",
});
/* c8 ignore stop */
