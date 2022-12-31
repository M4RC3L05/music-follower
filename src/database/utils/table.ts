import sql, { type Query } from "@leafac/sqlite";

import { db } from "#src/database/db.js";
import { btw, eq, exts, gt, gte, iin, isQuery, join, lk, lt, lte, ne } from "#src/database/utils/sql.js";

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
    return join(Object.entries(values).map(([key, value]) => this.eq(key as keyof T, value as T[keyof T])));
  }

  eq<K extends keyof T>(prop: K, value: T[K] | Query) {
    return eq<T>(this.lit(prop), isQuery(value) ? value : this.#toDbValue(prop, value));
  }

  ne<K extends keyof T>(prop: K, value: T[K] | Query) {
    return ne<T>(this.lit(prop), isQuery(value) ? value : this.#toDbValue(prop, value));
  }

  gt<K extends keyof T>(prop: K, value: T[K] | Query) {
    return gt<T>(this.lit(prop), isQuery(value) ? value : this.#toDbValue(prop, value));
  }

  lt<K extends keyof T>(prop: K, value: T[K] | Query) {
    return lt<T>(this.lit(prop), isQuery(value) ? value : this.#toDbValue(prop, value));
  }

  gte<K extends keyof T>(prop: K, value: T[K] | Query) {
    return gte<T>(this.lit(prop), isQuery(value) ? value : this.#toDbValue(prop, value));
  }

  lte<K extends keyof T>(prop: K, value: T[K] | Query) {
    return lte<T>(this.lit(prop), isQuery(value) ? value : this.#toDbValue(prop, value));
  }

  btw<K extends keyof T>(prop: K, ...limts: [T[K], T[K]]) {
    return btw(this.lit(prop), this.#toDbValue(prop, limts[0]), this.#toDbValue(prop, limts[1]));
  }

  lk<K extends keyof T>(prop: K, value: Query) {
    return lk(this.lit(prop), value);
  }

  in<K extends keyof T>(prop: K, ...value: Array<T[K] | Query>) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return iin(this.lit(prop), ...value.map((v) => (isQuery(v) ? v : this.#toDbValue(prop, v))));
  }

  exts<K extends keyof T>(prop: K, value: Query) {
    return exts(this.lit(prop), value);
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
