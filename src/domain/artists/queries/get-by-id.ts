import sql from "@leafac/sqlite";

import { type Artist, artistsTable } from "#src/domain/artists/mod.js";

export const getById = (id: number) =>
  artistsTable.get<Artist>(sql`
    select *
    from $${artistsTable.lit("table")}
    where $${artistsTable.lit("id")} = ${id};
  `);
