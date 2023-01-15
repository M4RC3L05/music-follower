import { before, describe, it } from "node:test";
import assert from "node:assert";

import * as hooks from "#src/utils/tests/hooks/mod.js";
import { create } from "./create.js";

describe("create()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  it("should add an artist", () => {
    assert.strict.deepEqual(create({ id: 1, imageUrl: "foo", name: "bar" }), { changes: 1, lastInsertRowid: 1 });
  });
});
