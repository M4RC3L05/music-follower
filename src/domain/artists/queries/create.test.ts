import { beforeAll, describe, expect, it } from "vitest";

import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { create } from "./create.js";

describe("create()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  it("should add an artist", () => {
    expect(create({ id: 1, imageUrl: "foo", name: "bar" })).toEqual({ changes: 1, lastInsertRowid: 1 });
  });
});
