import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { getAll } from "./get-all.js";

describe("getAll()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return empty array if no artists", () => {
    expect(getAll()).toEqual([]);
  });

  it("should return all artists", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });

    expect(getAll().map(({ id }) => ({ id }))).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
