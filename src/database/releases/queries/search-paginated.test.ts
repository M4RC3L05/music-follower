import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { searchPaginated } from "./search-paginated.js";

describe("searchPaginated()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should return no releases if there is no releases", () => {
    assert.strict.deepEqual(searchPaginated(), { data: [], total: 0 });
  });

  it("should return releases paginated", () => {
    releaseFixtures.loadRelease({ id: 1, releasedAt: new Date(1000) });
    releaseFixtures.loadRelease({ id: 2, releasedAt: new Date(500) });
    releaseFixtures.loadRelease({ id: 3, releasedAt: new Date(0) });

    const { data, total } = searchPaginated({ page: 1, limit: 2 });

    assert.strict.deepEqual({ data: data.map(({ id }) => ({ id })), total }, { data: [{ id: 3 }], total: 3 });
  });

  it("should search for releases name and artistName", () => {
    releaseFixtures.loadRelease({ id: 1, releasedAt: new Date(1000), name: "foo", artistName: "x" });
    releaseFixtures.loadRelease({ id: 2, releasedAt: new Date(500), name: "bar", artistName: "foobar" });
    releaseFixtures.loadRelease({ id: 3, releasedAt: new Date(250), name: "fox", artistName: "bar" });
    releaseFixtures.loadRelease({ id: 4, releasedAt: new Date(0), name: "qix", artistName: "qux" });

    const { data, total } = searchPaginated({ q: "fo" });

    assert.strict.deepEqual(
      { data: data.map(({ id }) => ({ id })), total },
      { data: [{ id: 1 }, { id: 2 }, { id: 3 }], total: 3 },
    );
  });
});
