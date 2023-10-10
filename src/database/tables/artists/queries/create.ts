import sql from "@leafac/sqlite";

import { type Artist } from "../types.js";
import artistsTable from "../table.js";

export const create = (data: Artist) =>
  artistsTable.get(sql`
    insert into $${artistsTable.lit("table")}
      ($${artistsTable.joinLit(Object.keys(data) as Array<keyof Artist>)})
    values
      ($${artistsTable.joinValues(data)})
    returning *
  `);
