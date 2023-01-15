import sql from "@leafac/sqlite";

import { type Artist, artists } from "#src/database/mod.js";

export const getAll = () =>
  artists.table.all<Artist>(sql`
    select *
    from $${artists.table.lit("table")}
  `);
