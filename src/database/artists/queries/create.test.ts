import assert from "node:assert";
import { it, describe, before } from "node:test";

import { create } from "./create.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";

describe("create()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  it("should add an artist", () => {
    assert.strict.deepEqual(create({ id: 1, imageUrl: "foo", name: "bar" }), { changes: 1, lastInsertRowid: 1 });
  });
});
