import sql from "@leafac/sqlite";

import { artists } from "#src/database/index.js";
import { type Artist } from "#src/database/artists/index.js";

export const create = (data: Artist) =>
  artists.table.run(sql`
    insert into $${artists.table.lit("table")}
      ($${artists.table.joinLit(Object.keys(data) as Array<keyof Artist>)})
    values
      ($${artists.table.joinValues(data)})
  `);
