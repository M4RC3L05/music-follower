import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as hooks from "#src/utils/tests/hooks/mod.js";
import { create } from "./create.js";
import { getById } from "./get-by-id.js";

describe("add()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should add a release", () => {
    expect(
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
    ).toEqual({ changes: 1, lastInsertRowid: 1 });
    expect(getById(1, "track")?.id).toBe(1);
  });
});
