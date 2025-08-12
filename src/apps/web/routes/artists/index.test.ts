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
import type { Artist } from "#src/database/types/mod.ts";
import { MemoryStore } from "@jcs224/hono-sessions";
import type { HTMLDocument } from "@b-fuze/deno-dom";

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
  db.exec("delete from artists");
  db.exec("delete from accounts");
  testFixtures.loadAccount(db);
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  memStore.data.clear();
});

afterAll(() => {
  db.close();
});

describe("GET /artists", () => {
  describe("snapshot", () => {
    it("render artists index page without artists", async (t) => {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);

      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });

    it("render artists index page with artists", async (t) => {
      testFixtures.loadArtist(db, { id: 1 });
      testFixtures.loadArtist(db, { id: 2 });
      testFixtures.loadArtist(db, { id: 3 });

      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);

      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/artists");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should mark artists item in navbar as active", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertSee(
      dom,
      '<a class="nav-link active" href="/artists">Artists</a>',
      "nav.navbar",
    );
  });

  it("should render artists index page without artists", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "header", "body");
    testUtils.assertSeeInOrder(
      dom,
      [
        '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=12&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=12&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=12&amp;page=0">Next <i class="bi bi-chevron-right"></i></a>',
        '<a class="btn btn-sm btn-outline-primary" href="/artists?limit=12&amp;page=0">End <i class="bi bi-chevron-double-right"></i></a>',
      ],
      "body header",
    );
    testUtils.assertNodeExists(dom, "main", "body");
    testUtils.assertSee(
      dom,
      '<p class="text-center">No artists to show</p>',
      "body main",
    );
  });

  it("should render artists index with links with query params", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists?q=b", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "header", "body");
    testUtils.assertSeeInOrder(
      dom,
      [
        '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=12&amp;q=b&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=12&amp;q=b&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
        '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=12&amp;q=b&amp;page=0">Next <i class="bi bi-chevron-right"></i></a>',
        '<a class="btn btn-sm btn-outline-primary" href="/artists?limit=12&amp;q=b&amp;page=0">End <i class="bi bi-chevron-double-right"></i></a>',
      ],
      "body header",
    );
    testUtils.assertNodeExists(dom, "main", "body");
    testUtils.assertSee(
      dom,
      '<p class="text-center">No artists to show</p>',
      "body main",
    );
  });

  it("should render artists index page with correct pagination with artists", async () => {
    const artistOne = testFixtures.loadArtist(db, { id: 1, name: "1foo" });
    const artistTwo = testFixtures.loadArtist(db, { id: 2, name: "2bar" });
    const artistThree = testFixtures.loadArtist(db, { id: 3, name: "3biz" });
    const artistFour = testFixtures.loadArtist(db, { id: 4, name: "4buz" });
    const artistFive = testFixtures.loadArtist(db, { id: 5, name: "5bax" });

    const checkArtistInPage = (dom: HTMLDocument, artist: Artist) => {
      testUtils.assertNodeExists(
        dom,
        `main img[src="${artist.image}"]`,
        "body",
      );
      testUtils.assertSee(
        dom,
        `<h3 class="mt-sm-0 mt-2">${artist.name}</h3>`,
        "body main",
      );
      testUtils.assertNodeExists(
        dom,
        `main div#unsub-artist-modal-${artist.id}`,
        "body",
      );
      testUtils.assertNodeExists(
        dom,
        `main button[data-bs-target="#unsub-artist-modal-${artist.id}"]`,
        "body",
      );
    };

    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists?page=0&limit=2", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      testUtils.assertNodeExists(dom, "header", "body");
      testUtils.assertSeeInOrder(
        dom,
        [
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=1">Next <i class="bi bi-chevron-right"></i></a>',
          '<a class="btn btn-sm btn-outline-primary" href="/artists?limit=2&amp;page=2">End <i class="bi bi-chevron-double-right"></i></a>',
        ],
        "body header",
      );
      testUtils.assertNodeExists(dom, "main", "body");
      testUtils.assertSeeTextInOrder(
        dom,
        [artistOne.name, artistTwo.name],
        "body main",
      );
      checkArtistInPage(dom, artistOne);
      checkArtistInPage(dom, artistTwo);
    }

    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists?page=1&limit=2", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      testUtils.assertNodeExists(dom, "header", "body");
      testUtils.assertSeeInOrder(
        dom,
        [
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=0"><i class="bi bi-chevron-left"></i> Previous</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=2">Next <i class="bi bi-chevron-right"></i></a>',
          '<a class="btn btn-sm btn-outline-primary" href="/artists?limit=2&amp;page=2">End <i class="bi bi-chevron-double-right"></i></a>',
        ],
        "body header",
      );
      testUtils.assertNodeExists(dom, "main", "body");
      testUtils.assertSeeTextInOrder(
        dom,
        [artistThree.name, artistFour.name],
        "body main",
      );
      checkArtistInPage(dom, artistThree);
      checkArtistInPage(dom, artistFour);
    }

    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists?page=2&limit=2", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      testUtils.assertNodeExists(dom, "header", "body");
      testUtils.assertSeeInOrder(
        dom,
        [
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=0"><i class="bi bi-chevron-double-left"></i> Start</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=1"><i class="bi bi-chevron-left"></i> Previous</a>',
          '<a class="btn btn-sm btn-outline-primary me-2" href="/artists?limit=2&amp;page=2">Next <i class="bi bi-chevron-right"></i></a>',
          '<a class="btn btn-sm btn-outline-primary" href="/artists?limit=2&amp;page=2">End <i class="bi bi-chevron-double-right"></i></a>',
        ],
        "body header",
      );
      testUtils.assertNodeExists(dom, "main", "body");
      testUtils.assertSeeText(dom, artistFive.name, "body main");
      checkArtistInPage(dom, artistFive);
    }
  });
});
