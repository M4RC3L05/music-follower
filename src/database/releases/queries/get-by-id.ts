import sql from "@leafac/sqlite";

import { type Release, releases } from "#src/database/mod.js";
import { and } from "#src/database/core/utils/sql.js";

export const getById = (id: number, type: "collection" | "track") =>
  releases.table.get<Release>(sql`
    select *
    from $${releases.table.lit("table")}
    where $${and(releases.table.eq("id", id), releases.table.eq("type", type))}
    limit 1
  `);
