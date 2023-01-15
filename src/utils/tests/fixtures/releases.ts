import sql from "@leafac/sqlite";

import { type Release, releases } from "#src/database/mod.js";

export const load = (data: Partial<Release> = {}) => {
  const result = releases.queries.create({
    artistName: "foo",
    coverUrl: "http://foo.bix",
    feedAt: new Date(),
    id: 1,
    metadata: {},
    name: "bar",
    releasedAt: new Date(),
    type: "track",
    ...data,
  });

  return releases.table.get(
    sql`select * from $${releases.table.lit("table")} where "rowId" = ${result.lastInsertRowid}`,
  );
};
