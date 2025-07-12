import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { testDbUtils, testUtils } from "#src/common/utils/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
import type { Hono } from "@hono/hono";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import { assertEquals } from "@std/assert";

let app: Hono;
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  app = makeApp({ database: db });
});

beforeEach(() => {
  db.exec("delete from releases");
});

afterAll(() => {
  db.close();
});

describe("GET /releases/:id/:type", () => {
  describe("snapshot", () => {
    it("should display release", async (t) => {
      const release = testFixtures.loadRelease(db, { id: 1 });
      const res = await testUtils.requestAuth(
        app,
        `/releases/${release.id}/${release.type}`,
      );
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/releases/1/track");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should return an error page if no release is found", async () => {
    const res = await testUtils.requestAuth(app, "/releases/1/track");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 404);
    testUtils.assertSeeText(dom, "Release not found", "body");
  });

  it("should show release", async () => {
    const release = testFixtures.loadRelease(db, {
      releasedAt: new Date(0).toISOString(),
    });
    const res = await testUtils.requestAuth(
      app,
      `/releases/${release.id}/${release.type}`,
    );
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main");
    testUtils.assertNotSeeText(dom, "To be released", "body main");
    testUtils.assertSeeTextInOrder(dom, [
      release.name,
      release.artistName,
      release.type,
      new Date(release.releasedAt).toISOString(),
      release.metadata,
    ], "body main");
    testUtils.assertNotSee(
      dom,
      '<audio style="width: 100%" src="http://preview.com"',
      "body main",
    );
  });

  it("should show release in the future", async () => {
    const release = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 60 * 1000).toISOString(),
    });
    const res = await testUtils.requestAuth(
      app,
      `/releases/${release.id}/${release.type}`,
    );
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main");
    testUtils.assertSeeTextInOrder(dom, [
      release.name,
      release.artistName,
      "To be released",
      release.type,
      new Date(release.releasedAt).toISOString(),
      release.metadata,
    ], "body main");
    testUtils.assertNotSee(
      dom,
      '<audio style="width: 100%" src="http://preview.com"',
      "body main",
    );
  });

  it("should show release ith preview in metadata", async () => {
    const release = testFixtures.loadRelease(db, {
      releasedAt: new Date(0).toISOString(),
      metadata: JSON.stringify({ previewUrl: "http://preview.com" }),
    });
    const res = await testUtils.requestAuth(
      app,
      `/releases/${release.id}/${release.type}`,
    );
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main");
    testUtils.assertNotSeeText(dom, "To be released", "body main");
    testUtils.assertSeeTextInOrder(dom, [
      release.name,
      release.artistName,
      release.type,
      new Date(release.releasedAt).toISOString(),
      JSON.stringify(JSON.parse(release.metadata), null, 2),
    ], "body main");
    testUtils.assertSee(
      dom,
      '<audio style="width: 100%" src="http://preview.com"',
      "body main",
    );
  });
});
