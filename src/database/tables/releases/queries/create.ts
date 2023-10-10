import sql from "@leafac/sqlite";

import { type Release } from "../types.js";
import releasesTable from "../table.js";

export const create = (data: Release) =>
  releasesTable.get(sql`
    insert into $${releasesTable.lit("table")}
      ($${releasesTable.joinLit(Object.keys(data) as Array<keyof Release>)})
    values
      ($${releasesTable.joinValues(data)})
    returning *
  `);
