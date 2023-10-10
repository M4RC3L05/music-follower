import sql, { type Query } from "@leafac/sqlite";

export const join = (values: unknown[], glue = sql`, `) =>
  values.reduce<Query>(
    (acc, curr, index, array) =>
      sql`$${acc}$${index === 0 || index === array.length ? sql`` : glue}$${
        isQuery(curr) ? sql`$${curr}` : sql`${curr}`
      }`,
    sql``,
  );

export const isQuery = (value: any): value is Query => {
  return typeof value === "object" && Array.isArray(value?.sourceParts) && Array.isArray(value?.parameters);
};
