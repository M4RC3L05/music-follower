import sql from "@leafac/sqlite";

import { releasesTable } from "#src/domain/releases/mod.js";

export const searchPaginated = ({
  limit = 10,
  page = 0,
  q,
  hidden,
  notHidden,
}: { page?: number; limit?: number; q?: string; hidden?: string; notHidden?: string } = {}) => {
  const where = [
    hidden
      ? sql`
        (
          exists (
            select true from json_each($${releasesTable.lit("hidden")})
            where json_each.value is ${hidden}
          )
        )
      `
      : undefined,
    notHidden
      ? sql`
        (
          not exists (
            select true from json_each($${releasesTable.lit("hidden")})
            where json_each.value is ${notHidden}
          )
        )
      `
      : undefined,
    q
      ? sql`
         (
              $${releasesTable.lit("artistName")} like ${`%${q}%`}
          or  $${releasesTable.lit("name")} like ${`%${q}%`}
        )
      `
      : undefined,
  ]
    .filter(Boolean)
    .flatMap((x) => [x, sql`and`])
    .slice(0, -1)
    // eslint-disable-next-line unicorn/no-array-reduce
    .reduce((acc, curr) => sql`$${acc}$${curr}`, sql``);

  return releasesTable.chunkWithTotal(
    sql`
      select *
      from $${releasesTable.lit("table")}
      $${where ? sql`where $${where}` : sql``}
      order by $${releasesTable.lit("releasedAt")} desc
    `,
    limit,
    page * limit,
  );
};
