import sql from "@leafac/sqlite";

import { type Artist } from "#src/database/tables/artists/types.js";
import { Table } from "#src/database/utils/table.js";

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

export default new ArtistsTable();
