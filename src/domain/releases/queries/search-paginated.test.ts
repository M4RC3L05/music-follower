import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { searchPaginated } from "./search-paginated.js";

describe("searchPaginated()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return no releases if there is no releases", () => {
    expect(searchPaginated()).toEqual({ data: [], total: 0 });
  });

  it("should return releases paginated", () => {
    fixtures.releases.load({ id: 1, releasedAt: new Date(1000) });
    fixtures.releases.load({ id: 2, releasedAt: new Date(500) });
    fixtures.releases.load({ id: 3, releasedAt: new Date(0) });

    const { data, total } = searchPaginated({ page: 1, limit: 2 });

    expect({ data: data.map(({ id }) => ({ id })), total }).toEqual({ data: [{ id: 3 }], total: 3 });
  });

  it("should search for releases name and artistName", () => {
    fixtures.releases.load({ id: 1, releasedAt: new Date(1000), name: "foo", artistName: "x" });
    fixtures.releases.load({ id: 2, releasedAt: new Date(500), name: "bar", artistName: "foobar" });
    fixtures.releases.load({ id: 3, releasedAt: new Date(250), name: "fox", artistName: "bar" });
    fixtures.releases.load({ id: 4, releasedAt: new Date(0), name: "qix", artistName: "qux" });

    const { data, total } = searchPaginated({ q: "fo" });

    expect({ data: data.map(({ id }) => ({ id })), total }).toEqual({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      total: 3,
    });
  });
});
