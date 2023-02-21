import sql from "@leafac/sqlite";

import { type Release, releases } from "#src/database/mod.js";

export const getLatests = (limit = 50) =>
  releases.table.all<Release>(sql`
    select *
    from $${releases.table.lit("table")}
    where date($${releases.table.lit("releasedAt")}, 'utc') <= date('now', 'utc')
    order by $${releases.table.lit("feedAt")} desc
    limit ${limit};
  `);
