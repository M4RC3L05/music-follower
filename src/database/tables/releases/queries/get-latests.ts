import sql from "@leafac/sqlite";

import { type Release } from "../types.js";
import releasesTable from "../table.js";

export const getLatests = (limit = 50) =>
  releasesTable.all<Release>(sql`
    select *
    from $${releasesTable.lit("table")}
    where date($${releasesTable.lit("releasedAt")}, 'utc') <= date('now', 'utc')
      and not exists(
        select true from json_each($${releasesTable.lit("hidden")})
        where json_each.value = 'feed'
      )
    order by $${releasesTable.lit("feedAt")} desc
    limit ${limit};
  `);
