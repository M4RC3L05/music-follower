import sql from "@leafac/sqlite";

import { type Artist, artists } from "#src/database/mod.js";

export const create = (data: Artist) =>
  artists.table.run(sql`
    insert into $${artists.table.lit("table")}
      ($${artists.table.joinLit(Object.keys(data) as Array<keyof Artist>)})
    values
      ($${artists.table.joinValues(data)})
  `);
