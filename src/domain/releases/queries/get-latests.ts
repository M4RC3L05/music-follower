import sql from "@leafac/sqlite";

import { type Release, releasesTable } from "#src/domain/releases/mod.js";

export const getLatests = (limit = 50) =>
  releasesTable.all<Release>(sql`
    select *
    from $${releasesTable.lit("table")}
    where date($${releasesTable.lit("releasedAt")}, 'utc') <= date('now', 'utc')
    order by $${releasesTable.lit("feedAt")} desc
    limit ${limit};
  `);
