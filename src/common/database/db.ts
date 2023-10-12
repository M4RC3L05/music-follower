import sql, { Database } from "@leafac/sqlite";
import config from "config";

import { makeLogger } from "../logger/mod.js";

const log = makeLogger("database");

const db = new Database(config.get("database.path"), {
  verbose(message, ...args) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    log.debug({ sql: message, args }, "Running sql");
  },
})
  .execute(sql`pragma journal_mode = WAL`)
  .execute(sql`pragma busy_timeout = 5000`)
  .execute(sql`pragma foreign_keys = ON`);

export default db;
