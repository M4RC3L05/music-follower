import sql from "@leafac/sqlite";

import { type Release, releases } from "#src/database/mod.js";

export const getById = (id: number, type: "collection" | "track") =>
  releases.table.get<Release>(sql`
    select *
    from $${releases.table.lit("table")}
    where 
          $${releases.table.lit("id")} = ${id} 
      and $${releases.table.lit("type")} = ${type}
    limit 1
  `);
