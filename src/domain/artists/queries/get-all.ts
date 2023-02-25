import sql from "@leafac/sqlite";

import { type Artist, artistsTable } from "#src/domain/artists/mod.js";

export const getAll = () =>
  artistsTable.all<Artist>(sql`
    select *
    from $${artistsTable.lit("table")}
  `);
