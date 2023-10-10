import sql from "@leafac/sqlite";

import { type Artist } from "../types.js";
import artistsTable from "../table.js";

export const getById = (id: number) =>
  artistsTable.get<Artist>(sql`
    select *
    from $${artistsTable.lit("table")}
    where $${artistsTable.lit("id")} = ${id};
  `);
