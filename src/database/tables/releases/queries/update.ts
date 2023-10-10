import sql from "@leafac/sqlite";

import { type Release } from "../types.js";
import releasesTable from "../table.js";

export const update = (data: Omit<Partial<Release>, "id">, id: string) =>
  releasesTable.get(sql`
    update $${releasesTable.lit("table")}
    set $${releasesTable.set(data)}
    where $${releasesTable.lit("id")} = ${id}
    returning *
  `);
