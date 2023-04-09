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
        releasedAt: (value: string) => new Date(value).toISOString(),
        metadata: (value: string) => JSON.stringify(value),
        feedAt: (value: string) => new Date(value).toISOString(),
      },
      {
        releasedAt: (value: string | Date) => new Date(value),
        metadata: (value: string) => JSON.parse(value) as Record<string, any>,
        feedAt: (value: string | Date) => new Date(value),
      },
    );
  }
}

const table = new ReleasesTable();

export default table;
