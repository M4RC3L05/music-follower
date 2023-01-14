import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { artistFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { searchPaginated } from "./search-paginated.js";

describe("searchPaginated()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should return no artists if there is no artists", () => {
    assert.strict.deepEqual(searchPaginated(), { data: [], total: 0 });
  });

  it("should return artists paginated", () => {
    artistFixtures.loadArtist({ id: 1 });
    artistFixtures.loadArtist({ id: 2 });
    artistFixtures.loadArtist({ id: 3 });

    const { data, total } = searchPaginated({ page: 1, limit: 2 });

    assert.strict.deepEqual({ data: data.map(({ id }) => ({ id })), total }, { data: [{ id: 3 }], total: 3 });
  });

  it("should search for artists name", () => {
    artistFixtures.loadArtist({ id: 1, name: "foo" });
    artistFixtures.loadArtist({ id: 2, name: "bar" });
    artistFixtures.loadArtist({ id: 3, name: "fox" });

    const { data, total } = searchPaginated({ q: "fo" });

    assert.strict.deepEqual(
      { data: data.map(({ id }) => ({ id })), total },
      { data: [{ id: 1 }, { id: 3 }], total: 2 },
    );
  });
});
