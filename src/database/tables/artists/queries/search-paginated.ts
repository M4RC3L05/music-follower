import sql from "@leafac/sqlite";

import { type Artist } from "../types.js";
import artistsTable from "../table.js";

export const searchPaginated = ({ page = 0, limit = 12, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return artistsTable.chunkWithTotal<Artist>(
    sql`
      select *
      from $${artistsTable.lit("table")}
      where
        ${q} is null or
        $${artistsTable.lit("name")} like ${`%${q}%`}
      order by $${artistsTable.lit("name")} asc
    `,
    limit,
    page * limit,
  );
};
