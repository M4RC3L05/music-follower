import sql from "@leafac/sqlite";

import { releases } from "#src/database/index.js";
import { type Release } from "#src/database/releases/index.js";
import { lte } from "#src/database/core/utils/sql.js";

export const getLatests = (limit = 50) =>
  releases.table.all<Release>(sql`
    select *
    from $${releases.table.lit("table")}
    where $${lte(sql`date($${releases.table.lit("releasedAt")}, 'utc')`, sql`date('now', 'utc')`)}
    order by $${releases.table.lit("feedAt")} desc
    limit ${limit};
  `);
