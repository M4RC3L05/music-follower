import sql from "@leafac/sqlite";

import { artists } from "#src/database/index.js";
import { type Artist } from "#src/database/artists/index.js";

export const getById = (id: number) =>
  artists.table.get<Artist>(sql`
    select *
    from $${artists.table.lit("table")}
    where $${artists.table.eq("id", id)};
  `);
