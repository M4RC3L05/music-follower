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
import { MemoryStore } from "@jcs224/hono-sessions";

let app: Hono;
let db: CustomDatabase;
let memStore: MemoryStore;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  memStore = new MemoryStore();
  app = makeApp({ database: db, sessioStore: memStore });
});

beforeEach(() => {
  db.exec("delete from releases");
  db.exec("delete from accounts");
  testFixtures.loadAccount(db);
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  memStore.data.clear();
});

afterAll(() => {
  db.close();
});

describe("GET /releases/:id/:type", () => {
  describe("snapshot", () => {
    it("should display release", async (t) => {
      const auth = await testUtils.authenticateRequest(app);
      const release = testFixtures.loadRelease(db, { id: 1 });
      const res = await app.request(
        `/releases/${release.id}/${release.type}`,
        { headers: { cookie: auth.sid } },
      );
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/releases/1/track");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should return an error page if no release is found", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/releases/1/track", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 404);
    testUtils.assertSeeText(dom, "Release not found", "body");
  });

  it("should show release", async () => {
    const release = testFixtures.loadRelease(db, {
      releasedAt: new Date(0).toISOString(),
    });
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request(
      `/releases/${release.id}/${release.type}`,
      { headers: { cookie: auth.sid } },
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
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request(
      `/releases/${release.id}/${release.type}`,
      { headers: { cookie: auth.sid } },
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
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request(
      `/releases/${release.id}/${release.type}`,
      { headers: { cookie: auth.sid } },
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
