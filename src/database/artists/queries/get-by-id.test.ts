import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { artistFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { getById } from "./get-by-id.js";

describe("getById()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should return undefined if no artist was found", () => {
    assert.strict.equal(getById(1), undefined);
  });

  it("should return the request artist", () => {
    artistFixtures.loadArtist({ id: 1 });
    artistFixtures.loadArtist({ id: 2 });

    assert.strict.equal(getById(1)!.id, 1);
  });
});
