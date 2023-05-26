import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
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
    const data = {
      artistName: "foo",
      coverUrl: "bar",
      feedAt: new Date(),
      id: 1,
      metadata: {},
      name: "bax",
      releasedAt: new Date(),
      type: "track",
    };

    expect(create(data)).toEqual(data);
    expect(getById(1, "track")?.id).toBe(1);
  });
});
