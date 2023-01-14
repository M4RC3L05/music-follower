import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { artistFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { deleteById } from "./delete-by-id.js";
import { getById } from "./get-by-id.js";

describe("deleteById()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should ignore if no artists to delete", () => {
    assert.strict.deepEqual(deleteById(1), { changes: 0, lastInsertRowid: 0 });
  });

  it("should delete a artist by id", () => {
    artistFixtures.loadArtist({ id: 1 });
    artistFixtures.loadArtist({ id: 3 });

    assert.strict.deepEqual(deleteById(1), { changes: 1, lastInsertRowid: 2 });
    assert.strict.deepEqual(getById(3)!.id, 3);
    assert.strict.deepEqual(getById(1), undefined);
  });
});
