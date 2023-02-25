import sql from "@leafac/sqlite";

import { releasesTable } from "#src/domain/releases/mod.js";

export const searchPaginated = ({ limit = 10, page = 0, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return releasesTable.chunkWithTotal(
    sql`
      select *
      from $${releasesTable.lit("table")}
      $${
        q
          ? sql`
            where $${releasesTable.lit("artistName")} like ${`%${q}%`}
            or    $${releasesTable.lit("name")} like ${`%${q}%`}
          `
          : sql``
      }
      order by $${releasesTable.lit("releasedAt")} desc
    `,
    limit,
    page * limit,
  );
};
