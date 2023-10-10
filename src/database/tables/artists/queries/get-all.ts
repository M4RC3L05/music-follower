import sql from "@leafac/sqlite";

import { type Artist } from "../types.js";
import artistsTable from "../table.js";

export const getAll = () =>
  artistsTable.all<Artist>(sql`
    select *
    from $${artistsTable.lit("table")}
  `);
