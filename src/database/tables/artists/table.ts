import sql from "@leafac/sqlite";

import { type Artist } from "./types.js";
import { Table } from "#src/common/database/table.js";

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

const table = new ArtistsTable();

export default table;
