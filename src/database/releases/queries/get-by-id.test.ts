import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { getById } from "./get-by-id.js";

describe("getById()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should return undefined if no release was found", () => {
    assert.strict.equal(getById(1, "track"), undefined);
  });

  it("should return the request release", () => {
    releaseFixtures.loadRelease({ id: 1, type: "track" });
    releaseFixtures.loadRelease({ id: 1, type: "collection" });

    const release = getById(1, "collection");
    assert.strict.deepEqual({ id: release!.id, type: release!.type }, { id: 1, type: "collection" });
  });
});
