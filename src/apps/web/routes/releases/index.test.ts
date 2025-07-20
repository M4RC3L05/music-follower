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
import type { Release } from "#src/database/types/mod.ts";
import type { JSDOM } from "jsdom";
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

describe("GET /releases", () => {
  describe("snapshot", () => {
    it("should display without releases", async (t) => {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request(`/releases`, {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });

    it("should display with releases", async (t) => {
      testFixtures.loadRelease(db, { id: 1 });
      testFixtures.loadRelease(db, { id: 2 });

      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request(`/releases`, {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/releases");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should mark releases item in navbar as active", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/releases", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertSee(
      dom,
      '<a class="nav-link active" href="/releases">Releases</a>',
      "nav.navbar",
    );
  });

  it("should render releases index page without releases", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/releases", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "header", "body");
    testUtils.assertSeeInOrder(
      dom,
      [
        '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=12&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=12&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=12&amp;page=0">Next <i class="bi bi-chevron-right"></i></a>',
        '<a class="btn btn-sm btn-outline-primary" href="/releases?limit=12&amp;page=0">End <i class="bi bi-chevron-double-right"></i></a>',
      ],
      "body header",
    );
    testUtils.assertNodeExists(dom, "main", "body");
    testUtils.assertSee(
      dom,
      '<p class="text-center">No releases to show</p>',
      "body main",
    );
  });

  it("should render orm errors if invalid search params provided", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/releases?hidden=b", {
      headers: { referer: "http://localhost/releases", cookie: auth.sid },
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "http://localhost/releases");

    const res2 = await app.request("/releases", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res2);

    testUtils.assertSee(
      dom,
      '<div class="invalid-feedback"><p key="0">The selected hidden is invalid',
      "body header form",
    );
  });

  it("should render releases index with links with query params", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/releases?q=b", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "header", "body");
    testUtils.assertSeeInOrder(
      dom,
      [
        '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=12&amp;q=b&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=12&amp;q=b&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=12&amp;q=b&amp;page=0">Next <i class="bi bi-chevron-right"></i></a>',
        '<a class="btn btn-sm btn-outline-primary" href="/releases?limit=12&amp;q=b&amp;page=0">End <i class="bi bi-chevron-double-right"></i></a>',
      ],
      "body header",
    );
    testUtils.assertNodeExists(dom, "main", "body");
    testUtils.assertSee(
      dom,
      '<p class="text-center">No releases to show</p>',
      "body main",
    );
  });

  it("should render releases index page with correct pagination with releases", async () => {
    const releaseOne = testFixtures.loadRelease(db, {
      id: 1,
      name: "1foo",
      releasedAt: new Date(Date.now() + 60 * 1000).toISOString(),
    });
    const releaseTwo = testFixtures.loadRelease(db, {
      id: 2,
      name: "2bar",
      releasedAt: new Date(100).toISOString(),
    });
    const releaseThree = testFixtures.loadRelease(db, {
      id: 3,
      name: "3biz",
      releasedAt: new Date(10).toISOString(),
    });
    const releaseFour = testFixtures.loadRelease(db, {
      id: 4,
      name: "4buz",
      releasedAt: new Date(1).toISOString(),
    });
    const releaseFive = testFixtures.loadRelease(db, {
      id: 5,
      name: "5bax",
      releasedAt: new Date(0).toISOString(),
    });

    const checkReleaseInPage = (dom: JSDOM, release: Release) => {
      testUtils.assertNodeExists(
        dom,
        `main img[src="${release.coverUrl}"]`,
        "body",
      );

      testUtils.assertSee(
        dom,
        `<a class="btn btn-outline-primary" href="/releases/${release.id}/${release.type}">`,
        "body main",
      );

      let txt = [];

      if (release.id === 1) txt.push("To be released");

      txt = [
        release.type,
        release.name,
        release.artistName,
        new Date(release.releasedAt).toISOString(),
      ];

      testUtils.assertSeeTextInOrder(dom, txt, "body main");
    };

    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/releases?page=0&limit=2", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      testUtils.assertNodeExists(dom, "header", "body");
      testUtils.assertSeeInOrder(
        dom,
        [
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=1">Next <i class="bi bi-chevron-right"></i></a>',
          '<a class="btn btn-sm btn-outline-primary" href="/releases?limit=2&amp;page=2">End <i class="bi bi-chevron-double-right"></i></a>',
        ],
        "body header",
      );
      testUtils.assertNodeExists(dom, "main", "body");
      testUtils.assertSeeTextInOrder(
        dom,
        [releaseOne.name, releaseTwo.name],
        "body main",
      );
      checkReleaseInPage(dom, releaseOne);
      checkReleaseInPage(dom, releaseTwo);
    }

    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/releases?page=1&limit=2", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      testUtils.assertNodeExists(dom, "header", "body");
      testUtils.assertSeeInOrder(
        dom,
        [
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=2">Next <i class="bi bi-chevron-right"></i></a>',
          '<a class="btn btn-sm btn-outline-primary" href="/releases?limit=2&amp;page=2">End <i class="bi bi-chevron-double-right"></i></a>',
        ],
        "body header",
      );
      testUtils.assertNodeExists(dom, "main", "body");
      testUtils.assertSeeTextInOrder(
        dom,
        [releaseThree.name, releaseFour.name],
        "body main",
      );
      checkReleaseInPage(dom, releaseThree);
      checkReleaseInPage(dom, releaseFour);
    }

    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/releases?page=2&limit=2", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      testUtils.assertNodeExists(dom, "header", "body");
      testUtils.assertSeeInOrder(
        dom,
        [
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=1"><i class="bi bi-chevron-left"></i> Previous</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/releases?limit=2&amp;page=2">Next <i class="bi bi-chevron-right"></i></a>',
          '<a class="btn btn-sm btn-outline-primary" href="/releases?limit=2&amp;page=2">End <i class="bi bi-chevron-double-right"></i></a>',
        ],
        "body header",
      );
      testUtils.assertNodeExists(dom, "main", "body");
      testUtils.assertSeeText(dom, releaseFive.name, "body main");
      checkReleaseInPage(dom, releaseFive);
    }
  });
});
