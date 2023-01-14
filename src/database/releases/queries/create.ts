import sql from "@leafac/sqlite";

import { releases } from "#src/database/index.js";
import { type Release } from "#src/database/releases/index.js";

export const create = (data: Release) =>
  releases.table.run(sql`
    insert into $${releases.table.lit("table")}
      ($${releases.table.joinLit(Object.keys(data) as Array<keyof Release>)})
    values
      ($${releases.table.joinValues(data)})
  `);
