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

  it("should return undefined if no release was found", () => {
    assert.strict.equal(getById(1, "track"), undefined);
  });

  it("should return the request release", () => {
    fixtures.releases.load({ id: 1, type: "track" });
    fixtures.releases.load({ id: 1, type: "collection" });

    const release = getById(1, "collection");
    assert.strict.deepEqual({ id: release!.id, type: release!.type }, { id: 1, type: "collection" });
  });
});
