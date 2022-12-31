import sql, { type Query } from "@leafac/sqlite";

export const sqliteConds = {
  eq: sql`=`,
  ne: sql`<>`,
  gt: sql`>`,
  lt: sql`<`,
  gte: sql`>=`,
  lte: sql`<=`,
  btw: sql`between`,
  lk: sql`like`,
  in: sql`in`,
  exts: sql`exists`,
};

export const and = (...queries: Query[]) => join(queries, sql` and `);
export const or = (...queries: Query[]) => join(queries, sql` or `);
export const not = (query: Query) => sql`not $${query}`;
export const condExp = <T = any>(key: Query, cond: keyof typeof sqliteConds, value: T[keyof T] | Query) =>
  sql`$${key} $${sqliteConds[cond]} $${isQuery(value) ? sql`$${value}` : sql`${value}`}`;

export const eq = <T = any>(prop: Query, value: T[keyof T] | Query) => condExp<T>(prop, "eq", value);
export const ne = <T = any>(prop: Query, value: T[keyof T] | Query) => condExp<T>(prop, "ne", value);
export const gt = <T = any>(prop: Query, value: T[keyof T] | Query) => condExp<T>(prop, "gt", value);
export const lt = <T = any>(prop: Query, value: T[keyof T] | Query) => condExp<T>(prop, "lt", value);
export const gte = <T = any>(prop: Query, value: T[keyof T] | Query) => condExp<T>(prop, "gte", value);
export const lte = <T = any>(prop: Query, value: T[keyof T] | Query) => condExp<T>(prop, "lte", value);
export const btw = <T = any>(prop: Query, from: T[keyof T] | Query, to: T[keyof T] | Query) =>
  condExp<T>(prop, "btw", sql`$${isQuery(from) ? from : sql`${from}`} and $${isQuery(to) ? to : sql`${to}`}`);
export const lk = <T = any>(prop: Query, value: Query) => condExp<T>(prop, "lk", value);
export const iin = <T = any>(prop: Query, ...value: Array<T[keyof T] | Query>) =>
  condExp<T>(prop, "in", sql`($${join(value)})`);
export const exts = <T = any>(prop: Query, value: Query) => condExp<T>(prop, "exts", sql`($${value})`);

export const join = (values: unknown[], glue = sql`, `) =>
  // eslint-disable-next-line unicorn/no-array-reduce
  values.reduce(
    (acc, curr, index, array) =>
      sql`$${acc}$${index === 0 || index === array.length ? sql`` : glue}$${
        isQuery(curr) ? sql`$${curr}` : sql`${curr}`
      }`,
    sql``,
  );

export const isQuery = (value: any): value is Query => {
  return typeof value === "object" && Array.isArray(value?.sourceParts) && Array.isArray(value?.parameters);
};
