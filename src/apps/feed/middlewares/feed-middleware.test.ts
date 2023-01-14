/* eslint-disable import/no-named-as-default-member */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import assert from "node:assert";
import { afterEach, before, beforeEach, describe, it } from "node:test";

import config from "config";
import sinon from "sinon";

import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.js";
import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";

describe("feedMiddleware()", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  beforeEach(() => {
    sinon.useFakeTimers(0);
  });

  afterEach(() => {
    sinon.restore();
    sinon.reset();
  });

  it("should fallback to rss if no accepts header is sent", async () => {
    const ctx = { request: { accepts: () => false } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/xml");

    // @ts-expect-error
    await assert.strict.snapshot(
      (ctx as any).body,
      "feedMiddleware() - should fallback to rss if no accepts header is sent",
    );
  });

  it("should send rss feed if it accepts `application/xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/xml" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/xml");

    // @ts-expect-error
    await assert.strict.snapshot(
      (ctx as any).body,
      "feedMiddleware() - should send rss feed if it accepts `application/xml`",
    );
  });

  it("should send rss feed if it accepts `application/rss+xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/rss+xml" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/rss+xml");

    // @ts-expect-error
    await assert.strict.snapshot(
      (ctx as any).body,
      "feedMiddleware() - should send rss feed if it accepts `application/rss+xml`",
    );
  });

  it("should send atom feed if it accepts `application/atom+xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/atom+xml" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/atom+xml");

    // @ts-expect-error
    await assert.strict.snapshot(
      (ctx as any).body,
      "feedMiddleware() - should send atom feed if it accepts `application/atom+xml`",
    );
  });

  it("should send json feed if it accepts `application/json`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/json" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/json");

    // @ts-expect-error
    await assert.strict.snapshot(
      (ctx as any).body,
      "feedMiddleware() - should send json feed if it accepts `application/json`",
    );
  });

  for (const ct of ["application/rss+xml", "application/atom+xml", "application/json"]) {
    it(`should send feed with elements for "${ct}"`, async () => {
      const ctx = { request: { accepts: (x: any) => x === ct } };

      databaseHooks.cleanup();
      releaseFixtures.loadRelease({ id: 1, feedAt: new Date(0) });
      releaseFixtures.loadRelease({ id: 2, feedAt: new Date(500) });
      releaseFixtures.loadRelease({ id: 3, feedAt: new Date(1000) });
      releaseFixtures.loadRelease({ id: 4, feedAt: new Date(1500) });

      sinon.stub(config, "get").returns(3);

      feedMiddleware(ctx as any);

      assert.strict.equal((ctx as any).type, ct);

      // @ts-expect-error
      await assert.strict.snapshot((ctx as any).body, `feedMiddleware() - should send feed with elements for "${ct}"`);
    });
  }

  it("should detect correctly the feed item link", async () => {
    const ctx = { request: { accepts: (x: any) => false } };

    databaseHooks.cleanup();
    releaseFixtures.loadRelease({
      id: 1,
      type: "track",
      metadata: { trackViewUrl: "foo", collectionViewUrl: "bar" },
      feedAt: new Date(0),
      coverUrl: "bix",
    });
    releaseFixtures.loadRelease({
      id: 2,
      type: "track",
      metadata: { trackViewUrl: undefined, collectionViewUrl: "bar" },
      feedAt: new Date(1),
      coverUrl: "bix",
    });
    releaseFixtures.loadRelease({
      id: 3,
      type: "track",
      metadata: { trackViewUrl: undefined, collectionViewUrl: undefined },
      feedAt: new Date(2),
      coverUrl: "bix",
    });
    releaseFixtures.loadRelease({
      id: 2,
      type: "collection",
      metadata: { collectionViewUrl: "foo" },
      feedAt: new Date(3),
      coverUrl: "bux",
    });
    releaseFixtures.loadRelease({
      id: 3,
      type: "collection",
      metadata: { collectionViewUrl: undefined },
      feedAt: new Date(4),
      coverUrl: "bux",
    });
    releaseFixtures.loadRelease({
      id: 1,
      type: "bix",
      metadata: { collectionViewUrl: undefined },
      feedAt: new Date(5),
      coverUrl: "bux",
    });

    sinon.stub(config, "get").returns(10);

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/xml");

    // @ts-expect-error
    await assert.strict.snapshot((ctx as any).body, "feedMiddleware() - should detect correctly the feed item link");
  });
});
