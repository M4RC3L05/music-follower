import { Database, type Statement } from "@db/sqlite";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";

const log = makeLogger("database");

export class CustomDatabase extends Database {
  #cache = new Map<string, Statement>();

  #ensureInCache(query: string) {
    const key = query.trim();

    if (!this.#cache.has(key)) {
      this.#cache.set(key, super.prepare(key));
    }

    return this.#cache.get(key)!;
  }

  override prepare(sql: string): Statement {
    return this.#ensureInCache(sql);
  }

  override close(): void {
    super.close();

    this.#cache.clear();
  }

  [Symbol.dispose]() {
    log.info("Closing database");

    this.exec("pragma optimize");

    this.close();

    log.info("Database closed successfully");
  }
}

export const makeDatabase = () => {
  log.info("Creating database");

  const db = new CustomDatabase(config.get("database.path"));

  db.exec("pragma journal_mode = WAL");
  db.exec("pragma busy_timeout = 5000");
  db.exec("pragma foreign_keys = ON");
  db.exec("pragma synchronous = NORMAL");
  db.exec("pragma temp_store = MEMORY");
  db.exec("pragma optimize = 0x10002");
  db.function("uuid_v4", () => globalThis.crypto.randomUUID());

  log.info("Database created successfully");

  return db;
};
