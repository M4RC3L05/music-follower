import sql from "@leafac/sqlite";

import { artists } from "#src/database/mod.js";

export const deleteById = (id: number) =>
  artists.table.run(sql`
    delete from $${artists.table.lit("table")}
    where $${artists.table.lit("id")} = ${id}
  `);
