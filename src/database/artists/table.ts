import sql from "@leafac/sqlite";

import { type Artist } from "#src/database/artists/types.js";
import { Table } from "#src/database/core/utils/table.js";

class ArtistsTable extends Table<Artist> {
  constructor() {
    super({
      table: sql`"artists"`,

      id: sql`"id"`,
      name: sql`"name"`,
      imageUrl: sql`"imageUrl"`,
    });
  }
}

export const table = new ArtistsTable();
