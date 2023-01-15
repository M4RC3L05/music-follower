import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { getAll } from "./get-all.js";

describe("getAll()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return empty array if no artists", () => {
    assert.strict.deepEqual(getAll(), []);
  });

  it("should return all artists", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });

    assert.strict.deepEqual(
      getAll().map(({ id }) => ({ id })),
      [{ id: 1 }, { id: 2 }],
    );
  });
});
