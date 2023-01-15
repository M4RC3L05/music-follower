import sql from "@leafac/sqlite";

import { type Release, releases } from "#src/database/mod.js";
import { lte } from "#src/database/core/utils/sql.js";

export const getLatests = (limit = 50) =>
  releases.table.all<Release>(sql`
    select *
    from $${releases.table.lit("table")}
    where $${lte(sql`date($${releases.table.lit("releasedAt")}, 'utc')`, sql`date('now', 'utc')`)}
    order by $${releases.table.lit("feedAt")} desc
    limit ${limit};
  `);
