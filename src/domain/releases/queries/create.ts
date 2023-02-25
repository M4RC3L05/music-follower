import sql from "@leafac/sqlite";

import { type Release, releasesTable } from "#src/domain/releases/mod.js";

export const create = (data: Release) =>
  releasesTable.run(sql`
    insert into $${releasesTable.lit("table")}
      ($${releasesTable.joinLit(Object.keys(data) as Array<keyof Release>)})
    values
      ($${releasesTable.joinValues(data)})
  `);
