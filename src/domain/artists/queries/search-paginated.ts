import sql from "@leafac/sqlite";

import { type Artist, artistsTable } from "#src/domain/artists/mod.js";

export const searchPaginated = ({ page = 0, limit = 12, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return artistsTable.chunkWithTotal<Artist>(
    sql`
      select *
      from $${artistsTable.lit("table")}
      $${q ? sql`where $${artistsTable.lit("name")} like ${`%${q}%`}` : sql``}
      order by $${artistsTable.lit("name")} asc
    `,
    limit,
    page * limit,
  );
};