import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { getById } from "./get-by-id.js";

describe("getById()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return undefined if no release was found", () => {
    expect(getById(1, "track")).toBeUndefined();
  });

  it("should return the request release", () => {
    fixtures.releases.load({ id: 1, type: "track" });
    fixtures.releases.load({ id: 1, type: "collection" });

    const release = getById(1, "collection");
    expect({ id: release!.id, type: release!.type }).toEqual({ id: 1, type: "collection" });
  });
});
