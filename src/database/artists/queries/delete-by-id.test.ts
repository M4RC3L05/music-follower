import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { deleteById } from "./delete-by-id.js";
import { getById } from "./get-by-id.js";

describe("deleteById()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should ignore if no artists to delete", () => {
    assert.strict.deepEqual(deleteById(1), { changes: 0, lastInsertRowid: 0 });
  });

  it("should delete a artist by id", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 3 });

    assert.strict.deepEqual(deleteById(1), { changes: 1, lastInsertRowid: 2 });
    assert.strict.deepEqual(getById(3)!.id, 3);
    assert.strict.deepEqual(getById(1), undefined);
  });
});
