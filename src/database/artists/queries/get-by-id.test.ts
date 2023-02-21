import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { getById } from "./get-by-id.js";

describe("getById()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return undefined if no artist was found", () => {
    expect(getById(1)).toBeUndefined();
  });

  it("should return the request artist", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });

    expect(getById(1)!.id).toBe(1);
  });
});
