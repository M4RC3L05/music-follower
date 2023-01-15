import sql from "@leafac/sqlite";

import { type Artist, artists } from "#src/database/mod.js";

export const load = (data: Partial<Artist> = {}) => {
  const result = artists.queries.create({ id: 1, name: "foo", imageUrl: "http://foo.bix", ...data });

  return artists.table.get(sql`select * from $${artists.table.lit("table")} where "rowId" = ${result.lastInsertRowid}`);
};
