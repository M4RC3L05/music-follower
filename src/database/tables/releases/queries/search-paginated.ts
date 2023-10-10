import sql from "@leafac/sqlite";

import releasesTable from "../table.js";

export const searchPaginated = ({
  limit = 10,
  page = 0,
  q,
  hidden,
  notHidden,
}: { page?: number; limit?: number; q?: string; hidden?: string; notHidden?: string } = {}) => {
  return releasesTable.chunkWithTotal(
    sql`
      select *
      from $${releasesTable.lit("table")}
      where (
        (
          ${q} is null or
          $${releasesTable.lit("artistName")} like ${`%${q}%`} or
          $${releasesTable.lit("name")} like ${`%${q}%`}
        )
        and
        (
          ${hidden} is null or
          exists (
            select true from json_each($${releasesTable.lit("hidden")})
            where json_each.value is ${hidden}
          )
        )
        and
        (
          ${notHidden} is null or
          not exists (
            select true from json_each($${releasesTable.lit("hidden")})
            where json_each.value is ${notHidden}
          )
        )
      )
      order by $${releasesTable.lit("releasedAt")} desc
    `,
    limit,
    page * limit,
  );
};
