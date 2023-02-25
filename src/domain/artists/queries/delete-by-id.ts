import sql from "@leafac/sqlite";

import { artistsTable } from "#src/domain/artists/mod.js";

export const deleteById = (id: number) =>
  artistsTable.run(sql`
    delete from $${artistsTable.lit("table")}
    where $${artistsTable.lit("id")} = ${id}
  `);
