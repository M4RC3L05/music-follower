import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { deleteById } from "./delete-by-id.js";
import { getById } from "./get-by-id.js";

describe("deleteById()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should ignore if no artists to delete", () => {
    expect(deleteById(1)).toEqual({ changes: 0, lastInsertRowid: 0 });
  });

  it("should delete a artist by id", () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 3 });

    expect(deleteById(1)).toEqual({ changes: 1, lastInsertRowid: 2 });
    expect(getById(3)!.id).toBe(3);
    expect(getById(1)).toBeUndefined();
  });
});
