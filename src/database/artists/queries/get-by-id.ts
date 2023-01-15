import sql from "@leafac/sqlite";

import { type Artist, artists } from "#src/database/mod.js";

export const getById = (id: number) =>
  artists.table.get<Artist>(sql`
    select *
    from $${artists.table.lit("table")}
    where $${artists.table.eq("id", id)};
  `);
