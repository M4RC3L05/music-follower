import sql from "@leafac/sqlite";

import { releases } from "#src/database/mod.js";

export const searchPaginated = ({ limit = 10, page = 0, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return releases.table.chunkWithTotal(
    sql`
      select *
      from $${releases.table.lit("table")}
      $${
        q
          ? sql`
            where $${releases.table.lit("artistName")} like ${`%${q}%`} 
            or    $${releases.table.lit("name")} like ${`%${q}%`}
          `
          : sql``
      }
      order by $${releases.table.lit("releasedAt")} desc
    `,
    limit,
    page * limit,
  );
};
