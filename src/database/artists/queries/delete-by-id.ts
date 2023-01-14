import sql from "@leafac/sqlite";

import { artists } from "#src/database/index.js";

export const deleteById = (id: number) =>
  artists.table.run(sql`
    delete from $${artists.table.lit("table")}
    where $${artists.table.eq("id", id)}
  `);
