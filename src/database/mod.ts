import { Database, type Statement } from "@db/sqlite";
import config from "config";

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
}

export const makeDatabase = () => {
  const db = new CustomDatabase(config.get("database.path"));

  db.exec("pragma journal_mode = WAL");
  db.exec("pragma busy_timeout = 5000");
  db.exec("pragma foreign_keys = ON");
  db.exec("pragma synchronous = NORMAL");
  db.exec("pragma temp_store = MEMORY");
  db.exec("pragma optimize = 0x10002");
  db.function("uuid_v4", () => globalThis.crypto.randomUUID());

  return db;
};
