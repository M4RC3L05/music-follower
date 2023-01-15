import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { searchPaginated } from "./search-paginated.js";

describe("searchPaginated()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return no artists if there is no artists", () => {
    assert.strict.deepEqual(searchPaginated(), { data: [], total: 0 });
  });

  it("should return artists paginated", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });
    fixtures.artists.load({ id: 3 });

    const { data, total } = searchPaginated({ page: 1, limit: 2 });

    assert.strict.deepEqual({ data: data.map(({ id }) => ({ id })), total }, { data: [{ id: 3 }], total: 3 });
  });

  it("should search for artists name", () => {
    fixtures.artists.load({ id: 1, name: "foo" });
    fixtures.artists.load({ id: 2, name: "bar" });
    fixtures.artists.load({ id: 3, name: "fox" });

    const { data, total } = searchPaginated({ q: "fo" });

    assert.strict.deepEqual(
      { data: data.map(({ id }) => ({ id })), total },
      { data: [{ id: 1 }, { id: 3 }], total: 2 },
    );
  });
});
