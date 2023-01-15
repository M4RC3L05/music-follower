import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { getLatests } from "./get-latests.js";

describe("getLatests()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  it("should return empty array if no releases", () => {
    assert.strict.deepEqual(getLatests(), []);
  });

  it("should not include releases after today", () => {
    fixtures.releases.load({ id: 1, releasedAt: new Date(), feedAt: new Date(1000) });
    fixtures.releases.load({ id: 2, releasedAt: new Date(Date.now() - 1000 * 60), feedAt: new Date(500) });
    fixtures.releases.load({ id: 3, releasedAt: new Date(Date.now() - 1000 * 60 * 60), feedAt: new Date(500) });
    fixtures.releases.load({
      id: 4,
      releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      feedAt: new Date(0),
    });

    assert.strict.deepEqual(
      getLatests().map(({ id }) => ({ id })),
      [{ id: 1 }, { id: 2 }, { id: 3 }],
    );
  });

  it("should return the latest releases in the correct order", () => {
    fixtures.releases.load({ id: 1, feedAt: new Date(500) });
    fixtures.releases.load({ id: 2, feedAt: new Date(0) });
    fixtures.releases.load({ id: 3, feedAt: new Date(1000) });

    assert.strict.deepEqual(
      getLatests().map(({ id }) => ({ id })),
      [{ id: 3 }, { id: 1 }, { id: 2 }],
    );
  });

  it("should allow to set the max number of releases to retrieve", () => {
    fixtures.releases.load({ id: 1, feedAt: new Date(1000) });
    fixtures.releases.load({ id: 2, feedAt: new Date(500) });
    fixtures.releases.load({ id: 3, feedAt: new Date(0) });

    assert.strict.deepEqual(
      getLatests(2).map(({ id }) => ({ id })),
      [{ id: 1 }, { id: 2 }],
    );
  });
});
