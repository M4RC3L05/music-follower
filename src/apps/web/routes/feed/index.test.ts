import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { FakeTime } from "@std/testing/time";
import { assertSnapshot } from "@std/testing/snapshot";
import { assertEquals } from "@std/assert";
import { testDbUtils } from "#src/common/utils/mod.ts";
import type { Hono } from "@hono/hono";
import { makeApp } from "#src/apps/web/app.tsx";
import { MemoryStore } from "@jcs224/hono-sessions";

let app: Hono;
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  app = makeApp({ database: db, sessioStore: new MemoryStore() });
});

beforeEach(() => {
  db.exec("delete from releases");
});

afterAll(() => {
  db.close();
});

describe("GET /feed", () => {
  it("should handle no releases", async () => {
    const response = await app.request("/feed", {
      headers: { accept: "application/json" },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      version: "https://jsonfeed.org/version/1",
      title: "Music releases",
      description: "Get the latest music releases from artist you follow",
      items: [],
    });
  });

  it("should show releases in feed is allowed/released", async () => {
    const release = testFixtures.loadRelease(db, {
      releasedAt: new Date().toISOString(),
      name: "foo",
      artistName: "bar",
      feedAt: new Date().toISOString(),
    });
    const releaseNew = testFixtures.loadRelease(db, {
      releasedAt: new Date().toISOString(),
      name: "foo",
      artistName: "bar",
      feedAt: new Date(Date.now() + 1000).toISOString(),
    });
    // future release
    testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 1_000_000).toISOString(),
      name: "foo",
    });

    // hidden for feed
    testFixtures.loadRelease(db, {
      releasedAt: new Date(0).toISOString(),
      hidden: JSON.stringify(["feed"]),
      name: "foo",
    });

    using _ = new FakeTime(0);

    const response = await app.request("/feed", {
      headers: { accept: "application/json" },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(
      data,
      {
        version: "https://jsonfeed.org/version/1",
        title: "Music releases",
        description: "Get the latest music releases from artist you follow",
        items: [{
          id: String(releaseNew.id),
          url: releaseNew.coverUrl,
          title: `${releaseNew.name} by ${releaseNew.artistName}`,
          content_html: `
          <img src="${releaseNew.coverUrl}" />
          <h1>${releaseNew.name}</h1><p>${releaseNew.artistName}</p>
          <p>${new Date(releaseNew.releasedAt).getFullYear()}</p>
          `.trim(),
          date_modified: new Date(releaseNew.feedAt).toISOString(),
        }, {
          id: String(release.id),
          url: release.coverUrl,
          title: `${release.name} by ${release.artistName}`,
          content_html: `
          <img src="${release.coverUrl}" />
          <h1>${release.name}</h1><p>${release.artistName}</p>
          <p>${new Date(release.releasedAt).getFullYear()}</p>
          `.trim(),
          date_modified: new Date(release.feedAt).toISOString(),
        }],
      },
    );
  });

  it("should use metadtaa for the feed link", async () => {
    const releaseNoMetadata = testFixtures.loadRelease(db, {
      releasedAt: new Date().toISOString(),
      feedAt: new Date(Date.now() + 4000).toISOString(),
      coverUrl: "biz",
    });
    const releaseMetadataAlbum = testFixtures.loadRelease(db, {
      releasedAt: new Date().toISOString(),
      metadata: JSON.stringify({ collectionViewUrl: "foo" }),
      type: "collection",
      feedAt: new Date(Date.now() + 3000).toISOString(),
    });
    const releaseMetadataTrack = testFixtures.loadRelease(db, {
      metadata: JSON.stringify({
        collectionViewUrl: "bar",
        trackViewUrl: "buz",
      }),
      releasedAt: new Date().toISOString(),
      type: "track",
      feedAt: new Date(Date.now() + 2000).toISOString(),
    });
    const releaseMetadataTrackCollectionUrlOnly = testFixtures.loadRelease(db, {
      releasedAt: new Date().toISOString(),
      metadata: JSON.stringify({ collectionViewUrl: "baz" }),
      type: "track",
      feedAt: new Date(Date.now() + 1000).toISOString(),
    });

    using _ = new FakeTime(0);

    const response = await app.request("/feed", {
      headers: { accept: "application/json" },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.items[0].url, releaseNoMetadata.coverUrl);
    assertEquals(
      data.items[1].url,
      JSON.parse(releaseMetadataAlbum.metadata).collectionViewUrl,
    );
    assertEquals(
      data.items[2].url,
      JSON.parse(releaseMetadataTrack.metadata).trackViewUrl,
    );
    assertEquals(
      data.items[3].url,
      JSON.parse(releaseMetadataTrackCollectionUrlOnly.metadata)
        .collectionViewUrl,
    );
  });

  it("should respond with `application/xml` by default", async () => {
    using _ = new FakeTime(0);

    const response = await app.request("/feed");
    const data = await response.text();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "application/xml");
    assertEquals(
      data.replaceAll("\n", "").replaceAll(" ", ""),
      `<?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0">
        <channel>
          <title>Music releases</title>
          <link>undefined</link>
          <description>Get the latest music releases from artist you follow</description>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
          <generator>Music Follower</generator>
          <language>en</language>
          <copyright>Music Follower</copyright>
        </channel>
      </rss>
      `.trim().replaceAll("\n", "").replaceAll(" ", ""),
    );
  });

  const contentTypes = [
    "application/rss+xml",
    "application/xml",
    "application/atom+xml",
    "application/json",
  ];

  for (const contentType of contentTypes) {
    it(`should send body as "${contentType}" if accepts is "${contentType}"`, async (t) => {
      using _ = new FakeTime(0);

      testFixtures.loadRelease(db, {
        id: 1,
        releasedAt: new Date().toISOString(),
        name: "foo",
        artistName: "bar",
      });

      const response = await app.request("/feed", {
        headers: { accept: contentType },
      });
      const data = await response.text();

      assertEquals(response.status, 200);
      assertEquals(response.headers.get("content-type"), contentType);
      await assertSnapshot(t, data);
    });
  }
});
