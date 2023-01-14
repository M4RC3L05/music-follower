import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { getLatests } from "./get-latests.js";

describe("getLatests()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    databaseHooks.cleanup();
  });

  it("should return empty array if no releases", () => {
    assert.strict.deepEqual(getLatests(), []);
  });

  it("should not include releases after today", () => {
    releaseFixtures.loadRelease({ id: 1, releasedAt: new Date(), feedAt: new Date(1000) });
    releaseFixtures.loadRelease({ id: 2, releasedAt: new Date(Date.now() - 1000 * 60), feedAt: new Date(500) });
    releaseFixtures.loadRelease({ id: 3, releasedAt: new Date(Date.now() - 1000 * 60 * 60), feedAt: new Date(500) });
    releaseFixtures.loadRelease({
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
    releaseFixtures.loadRelease({ id: 1, feedAt: new Date(500) });
    releaseFixtures.loadRelease({ id: 2, feedAt: new Date(0) });
    releaseFixtures.loadRelease({ id: 3, feedAt: new Date(1000) });

    assert.strict.deepEqual(
      getLatests().map(({ id }) => ({ id })),
      [{ id: 3 }, { id: 1 }, { id: 2 }],
    );
  });

  it("should allow to set the max number of releases to retrieve", () => {
    releaseFixtures.loadRelease({ id: 1, feedAt: new Date(1000) });
    releaseFixtures.loadRelease({ id: 2, feedAt: new Date(500) });
    releaseFixtures.loadRelease({ id: 3, feedAt: new Date(0) });

    assert.strict.deepEqual(
      getLatests(2).map(({ id }) => ({ id })),
      [{ id: 1 }, { id: 2 }],
    );
  });
});
