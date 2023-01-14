import sql from "@leafac/sqlite";

import { artists } from "#src/database/index.js";
import { type Artist } from "#src/database/artists/index.js";

export const searchPaginated = ({ page = 0, limit = 12, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return artists.table.chunkWithTotal<Artist>(
    sql`
      select *
      from $${artists.table.lit("table")}
      $${q ? sql`where $${artists.table.lk("name", sql`${`%${q}%`}`)}` : sql``}
      order by $${artists.table.lit("name")} asc
    `,
    limit,
    page * limit,
  );
};
