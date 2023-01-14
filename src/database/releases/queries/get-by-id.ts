import sql from "@leafac/sqlite";

import { releases } from "#src/database/index.js";
import { type Release } from "#src/database/releases/index.js";
import { and } from "#src/database/core/utils/sql.js";

export const getById = (id: number, type: "collection" | "track") =>
  releases.table.get<Release>(sql`
    select *
    from $${releases.table.lit("table")}
    where $${and(releases.table.eq("id", id), releases.table.eq("type", type))}
    limit 1
  `);
