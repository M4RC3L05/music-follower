import { type TSqlFragment, sql } from "@m4rc3l05/sqlite-tag";
import Database, { type Statement } from "better-sqlite3";
import config from "config";

export * from "./types/mod.js";

export class CustomDatabase extends Database {
  #cache = new Map<string, Statement>();

  #ensureInCache(query: string) {
    const key = query.trim();

    if (!this.#cache.has(key)) {
      this.#cache.set(key, this.prepare(key));
    }

    return this.#cache.get(key) as Statement;
  }

  get<T>(query: TSqlFragment): T | undefined {
    const prepared = this.#ensureInCache(query.query);

    return prepared.get(query.params) as T | undefined;
  }

  all<T>(query: TSqlFragment): T[] {
    const prepared = this.#ensureInCache(query.query);

    return prepared.all(query.params) as T[];
  }

  execute(query: TSqlFragment) {
    this.run(query);

    return this;
  }

  run(query: TSqlFragment) {
    const prepared = this.#ensureInCache(query.query);

    return prepared.run(query.params);
  }

  iterate<T>(query: TSqlFragment): IterableIterator<T> {
    const prepared = this.#ensureInCache(query.query);

    return prepared.iterate(query.params) as IterableIterator<T>;
  }
}

export const makeDatabase = () =>
  new CustomDatabase(config.get("database.path"))
    .execute(sql`pragma journal_mode = WAL`)
    .execute(sql`pragma busy_timeout = 5000`)
    .execute(sql`pragma foreign_keys = ON`);
