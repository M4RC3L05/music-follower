import sql from "@leafac/sqlite";

import { releases } from "#src/database/index.js";
import { or } from "#src/database/core/utils/sql.js";

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
