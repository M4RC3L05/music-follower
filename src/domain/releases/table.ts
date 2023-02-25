import sql from "@leafac/sqlite";

import { type Release } from "./types.js";
import { Table } from "#src/common/database/table.js";

class ReleasesTable extends Table<Release> {
  constructor() {
    super(
      {
        table: sql`"releases"`,

        id: sql`"id"`,
        artistName: sql`"artistName"`,
        name: sql`"name"`,
        releasedAt: sql`"releasedAt"`,
        coverUrl: sql`"coverUrl"`,
        type: sql`"type"`,
        metadata: sql`"metadata"`,
        feedAt: sql`"feedAt"`,
      },
      {
        releasedAt: (value) => new Date(value).toISOString(),
        metadata: (value) => JSON.stringify(value),
        feedAt: (value) => new Date(value).toISOString(),
      },
      {
        releasedAt: (value) => new Date(value),
        metadata: (value) => JSON.parse(value) as Record<string, any>,
        feedAt: (value) => new Date(value),
      },
    );
  }
}

const table = new ReleasesTable();

export default table;
