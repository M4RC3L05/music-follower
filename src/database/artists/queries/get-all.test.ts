import assert from "node:assert";
import { it, describe, before, beforeEach } from "node:test";

import { getAll } from "./get-all.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { artistFixtures } from "#src/utils/tests/fixtures/index.js";

describe("getAll()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should return empty array if no artists", () => {
    assert.strict.deepEqual(getAll(), []);
  });

  it("should return all artists", () => {
    artistFixtures.loadArtist({ id: 1 });
    artistFixtures.loadArtist({ id: 2 });

    assert.strict.deepEqual(
      getAll().map(({ id }) => ({ id })),
      [{ id: 1 }, { id: 2 }],
    );
  });
});
