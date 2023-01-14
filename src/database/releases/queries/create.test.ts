import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { create } from "./create.js";
import { getById } from "./get-by-id.js";

describe("add()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should add a release", () => {
    assert.strict.deepEqual(
      create({
        artistName: "foo",
        coverUrl: "bar",
        feedAt: new Date(),
        id: 1,
        metadata: {},
        name: "bax",
        releasedAt: new Date(),
        type: "track",
      }),
      { changes: 1, lastInsertRowid: 1 },
    );
    assert.strict.equal(getById(1, "track")?.id, 1);
  });
});
