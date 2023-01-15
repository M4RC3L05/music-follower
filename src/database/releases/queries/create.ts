import sql from "@leafac/sqlite";

import { type Release, releases } from "#src/database/mod.js";

export const create = (data: Release) =>
  releases.table.run(sql`
    insert into $${releases.table.lit("table")}
      ($${releases.table.joinLit(Object.keys(data) as Array<keyof Release>)})
    values
      ($${releases.table.joinValues(data)})
  `);
