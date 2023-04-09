/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import config from "config";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { feedMiddleware } from "#src/apps/http/feed/middlewares/feed-middleware.js";

describe("feedMiddleware()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();

    vi.useFakeTimers({ now: 0 });
  });

  it("should fallback to rss if no accepts header is sent", async () => {
    const ctx = { request: { accepts: () => false } };

    feedMiddleware(ctx as any);

    expect((ctx as any).type).toBe("application/xml");
    expect((ctx as any).body).toMatchSnapshot();
  });

  it("should send rss feed if it accepts `application/xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/xml" } };

    feedMiddleware(ctx as any);

    expect((ctx as any).type).toBe("application/xml");
    expect((ctx as any).body).toMatchSnapshot();
  });

  it("should send rss feed if it accepts `application/rss+xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/rss+xml" } };

    feedMiddleware(ctx as any);

    expect((ctx as any).type).toBe("application/rss+xml");
    expect((ctx as any).body).toMatchSnapshot();
  });

  it("should send atom feed if it accepts `application/atom+xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/atom+xml" } };

    feedMiddleware(ctx as any);

    expect((ctx as any).type).toBe("application/atom+xml");
    expect((ctx as any).body).toMatchSnapshot();
  });

  it("should send json feed if it accepts `application/json`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/json" } };

    feedMiddleware(ctx as any);

    expect((ctx as any).type).toBe("application/json");
    expect((ctx as any).body).toMatchSnapshot();
  });

  for (const ct of ["application/rss+xml", "application/atom+xml", "application/json"]) {
    it(`should send feed with elements for "${ct}"`, () => {
      const ctx = { request: { accepts: (x: any) => x === ct } };

      fixtures.releases.load({ id: 1, feedAt: new Date(0) });
      fixtures.releases.load({ id: 2, feedAt: new Date(500) });
      fixtures.releases.load({ id: 3, feedAt: new Date(1000) });
      fixtures.releases.load({ id: 4, feedAt: new Date(1500) });

      vi.spyOn(config, "get").mockReturnValue(3);

      feedMiddleware(ctx as any);

      expect((ctx as any).type).toBe(ct);
      expect((ctx as any).body).toMatchSnapshot();
    });
  }

  it("should detect correctly the feed item link", async () => {
    const ctx = { request: { accepts: (x: any) => false } };

    fixtures.releases.load({
      id: 1,
      type: "track",
      metadata: { trackViewUrl: "foo", collectionViewUrl: "bar" },
      feedAt: new Date(0),
      coverUrl: "bix",
    });
    fixtures.releases.load({
      id: 2,
      type: "track",
      metadata: { trackViewUrl: undefined, collectionViewUrl: "bar" },
      feedAt: new Date(1),
      coverUrl: "bix",
    });
    fixtures.releases.load({
      id: 3,
      type: "track",
      metadata: { trackViewUrl: undefined, collectionViewUrl: undefined },
      feedAt: new Date(2),
      coverUrl: "bix",
    });
    fixtures.releases.load({
      id: 2,
      type: "collection",
      metadata: { collectionViewUrl: "foo" },
      feedAt: new Date(3),
      coverUrl: "bux",
    });
    fixtures.releases.load({
      id: 3,
      type: "collection",
      metadata: { collectionViewUrl: undefined },
      feedAt: new Date(4),
      coverUrl: "bux",
    });
    fixtures.releases.load({
      id: 1,
      type: "bix",
      metadata: { collectionViewUrl: undefined },
      feedAt: new Date(5),
      coverUrl: "bux",
    });

    vi.spyOn(config, "get").mockReturnValue(10);

    feedMiddleware(ctx as any);

    expect((ctx as any).type).toBe("application/xml");
    expect((ctx as any).body).toMatchSnapshot();
  });
});
