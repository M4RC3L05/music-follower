import sql from "@leafac/sqlite";

import { artists } from "#src/database/index.js";
import { type Artist } from "#src/database/artists/index.js";

export const getAll = () =>
  artists.table.all<Artist>(sql`
    select *
    from $${artists.table.lit("table")}
  `);
