import sql from "@leafac/sqlite";

import { type Release } from "../types.js";
import releasesTable from "../table.js";

export const getById = (id: number, type: "collection" | "track") =>
  releasesTable.get<Release>(sql`
    select *
    from $${releasesTable.lit("table")}
    where
          $${releasesTable.lit("id")} = ${id}
      and $${releasesTable.lit("type")} = ${type}
    limit 1
  `);
