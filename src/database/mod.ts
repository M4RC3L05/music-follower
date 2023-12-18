import sql, { Database } from "@leafac/sqlite";
import config from "config";

export * from "./types/mod.js";

export const makeDatabase = () =>
  new Database(config.get("database.path"))
    .execute(sql`pragma journal_mode = WAL`)
    .execute(sql`pragma busy_timeout = 5000`)
    .execute(sql`pragma foreign_keys = ON`);
