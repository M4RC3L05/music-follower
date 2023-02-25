import sql, { type Query } from "@leafac/sqlite";

import db from "#src/common/clients/db.js";
import { join } from "#src/common/utils/sql-utils.js";

export abstract class Table<T = any> {
  constructor(
    public literals: Record<keyof T, Query> & { table: Query },
    public toDbMappers?: Partial<Record<keyof T, (value: any) => any>>,
    public fromDbMappers?: Partial<Record<keyof T, (value: any) => T[keyof T]>>,
  ) {}

  #toDbValue<K extends keyof T>(key: K, value: unknown) {
    if (!this.toDbMappers) return value;
    if (!(key in this.toDbMappers)) return value;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.toDbMappers[key]!(value);
  }

  #fromDbValue<K extends keyof T>(key: K, value: unknown) {
    if (!this.fromDbMappers) return value;
    if (!(key in this.fromDbMappers)) return value;

    return this.fromDbMappers[key]!(value);
  }

  lit<K extends keyof typeof this.literals>(key: K) {
    return this.literals[key];
  }

  joinLit<K extends keyof typeof this.literals>(values: K[], glue?: Query) {
    return join(
      values.map((l) => this.lit(l)),
      glue,
    );
  }

  joinValues(values: Partial<T>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return join(Object.entries(values).map(([key, value]) => this.#toDbValue(key as keyof T, value as T[keyof T])));
  }

  set(values: Partial<T>) {
    return join(
      Object.entries(values).map(
        ([key, value]) => sql`$${this.lit(key as keyof T)} = ${this.#toDbValue(key as keyof T, value)}`,
      ),
    );
  }

  get<R extends Partial<T>>(query: Query) {
    let item = db.get<R>(query);

    if (item) {
      item = Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, this.#fromDbValue(key as keyof T, value)]),
      ) as R;
    }

    return item;
  }

  all<R extends Partial<T>>(query: Query) {
    return db
      .all<R>(query)
      .map(
        (item) =>
          Object.fromEntries(
            Object.entries(item).map(([key, value]) => [key, this.#fromDbValue(key as keyof T, value)]),
          ) as R,
      );
  }

  chunkWithTotal<R extends Partial<T>>(query: Query, limit: number, offset: number) {
    const total = db.get<{ total: number }>(sql`select count(*) as total from ($${query})`)!;
    const data = this.all<R>(sql`select * from ($${query}) limit ${limit} offset ${offset}`);

    return {
      /* c8 ignore next */
      total: total?.total ?? data.length,
      data,
    };
  }

  execute(query: Query) {
    return db.execute(query);
  }

  run(query: Query) {
    return db.run(query);
  }
}
