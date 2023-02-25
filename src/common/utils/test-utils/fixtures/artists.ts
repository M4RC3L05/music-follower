import sql from "@leafac/sqlite";

import { type Artist, artistQueries, artistsTable } from "#src/domain/artists/mod.js";

export const load = (data: Partial<Artist> = {}) => {
  const result = artistQueries.create({ id: 1, name: "foo", imageUrl: "http://foo.bix", ...data });

  return artistsTable.get(sql`select * from $${artistsTable.lit("table")} where "rowId" = ${result.lastInsertRowid}`);
};
