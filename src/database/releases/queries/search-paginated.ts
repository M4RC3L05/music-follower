import sql from "@leafac/sqlite";

import { or } from "#src/database/core/utils/sql.js";
import { releases } from "#src/database/mod.js";

export const searchPaginated = ({ limit = 10, page = 0, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return releases.table.chunkWithTotal(
    sql`
      select *
      from $${releases.table.lit("table")}
      $${
        q
          ? sql`where ($${or(
              releases.table.lk("artistName", sql`${`%${q}%`}`),
              releases.table.lk("name", sql`${`%${q}%`}`),
            )})`
          : sql``
      }
      order by $${releases.table.lit("releasedAt")} desc
    `,
    limit,
    page * limit,
  );
};
