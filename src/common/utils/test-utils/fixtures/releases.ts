import sql from "@leafac/sqlite";

import { type Release, releasesQueries, releasesTable } from "#src/domain/releases/mod.js";

export const load = (data: Partial<Release> = {}) => {
  const result = releasesQueries.create({
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

  return releasesTable.get(sql`select * from $${releasesTable.lit("table")} where "rowId" = ${result.lastInsertRowid}`);
};
