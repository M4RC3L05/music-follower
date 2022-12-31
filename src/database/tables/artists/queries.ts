import sql from "@leafac/sqlite";

import table from "#src/database/tables/artists/table.js";
import { type Artist } from "#src/database/tables/artists/types.js";

export const getById = (id: number) =>
  table.get<Artist>(sql`
    select *
    from $${table.lit("table")}
    where $${table.eq("id", id)};
  `);

export const getAll = () => table.all<Artist>(sql`select * from $${table.lit("table")};`);

export const searchPaginated = ({ page = 0, limit = 12, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return table.chunkWithTotal<Artist>(
    sql`
      select *
      from $${table.lit("table")}
      $${q ? sql`where $${table.lk("name", sql`${`%${q}%`}`)}` : sql``}
      order by $${table.lit("name")} asc
    `,
    limit,
    page * limit,
  );
};

export const add = (data: Artist) =>
  table.run(sql`
    insert into $${table.lit("table")}
      ($${table.joinLit(Object.keys(data) as Array<keyof Artist>)})
    values
      ($${table.joinValues(data)})
  `);

export const deleteById = (id: number) =>
  table.run(sql`
    delete from $${table.lit("table")}
    where $${table.eq("id", id)}
  `);
