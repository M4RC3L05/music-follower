import { Database, type RestBindParameters, Statement } from "@db/sqlite";
import { mapKeys } from "@std/collections";
import { toCamelCase as camelCase } from "@std/text";
import type { SqlFragment } from "@m4rc3l05/sqlite-tag";
import config from "config";

const toCamelCase = <T>(data: unknown) => {
  if (Array.isArray(data)) {
    return data.map((item) => mapKeys(item, (key) => camelCase(key))) as T;
  }

  if (typeof data === "object") {
    return mapKeys(
      data as Record<string, unknown>,
      (key) => camelCase(key),
    ) as T;
  }

  return data as T;
};

class CustomStmt<T = unknown> extends Statement {
  override *[Symbol.iterator](): IterableIterator<T> {
    for (const item of super[Symbol.iterator]()) {
      yield toCamelCase(item);
    }
  }
}

export class CustomDatabase extends Database {
  #cache = new Map<string, CustomStmt>();

  #ensureInCache<T>(query: string) {
    const key = query.trim();

    if (!this.#cache.has(key)) {
      this.#cache.set(key, this.prepare(key));
    }

    return this.#cache.get(key) as CustomStmt<T>;
  }

  override prepare<T>(sql: string): CustomStmt<T> {
    return new CustomStmt<T>(this, sql);
  }

  get<T>(query: SqlFragment): T | undefined {
    const prepared = this.#ensureInCache(query.query);

    return toCamelCase<T>(prepared.get(...query.params as RestBindParameters));
  }

  all<T>(query: SqlFragment): T[] {
    const prepared = this.#ensureInCache(query.query);

    return toCamelCase<T[]>(
      prepared.all(...query.params as RestBindParameters),
    );
  }

  execute(query: SqlFragment) {
    const prepared = this.#ensureInCache(query.query);

    return prepared.run(...query.params as RestBindParameters);
  }

  getPrepared<T>(query: SqlFragment) {
    return this.prepare<T>(query.query).bind(
      ...query.params as RestBindParameters,
    );
  }
}

export const makeDatabase = () => {
  const db = new CustomDatabase(config.get("database.path"));

  db.exec("pragma journal_mode = WAL");
  db.exec("pragma busy_timeout = 5000");
  db.exec("pragma foreign_keys = ON");
  db.exec("pragma synchronous = NORMAL");
  db.exec("pragma temp_store = MEMORY");
  // 4096 page_size * 10000 pages (cache_size) ≃ 40MB
  db.exec("pragma cache_size = 10000");
  db.function("uuid_v4", () => globalThis.crypto.randomUUID());

  return db;
};
