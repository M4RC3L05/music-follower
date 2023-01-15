import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { getById } from "./get-by-id.js";

describe("getById()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return undefined if no artist was found", () => {
    assert.strict.equal(getById(1), undefined);
  });

  it("should return the request artist", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });

    assert.strict.equal(getById(1)!.id, 1);
  });
});
