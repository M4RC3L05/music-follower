import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { testDbUtils, testUtils } from "#src/common/utils/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
import type { Hono } from "@hono/hono";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
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

describe("GET /artists/remote", () => {
  describe("snapshot", () => {
    it("should render page without query", async (t) => {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists/remote", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });

    it("should render page with query", async (t) => {
      using _ = stub(globalThis, "fetch", (url) => {
        if (url.toString().includes("https://itunes.apple.com/search")) {
          return Promise.resolve(Response.json({
            resultCount: 1,
            results: [{
              wrapperType: "foo",
              artistType: "foo",
              artistName: "foo bar",
              artistLinkUrl: "https://foo.bar",
              artistId: 1,
              amgArtistId: 1,
              primaryGenreName: "foo",
              primaryGenreId: 1,
            }],
          }));
        }

        return Promise.resolve(
          new Response(
            `<head><meta property="og:image" content="https://foo.com" /></head>`,
          ),
        );
      });

      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists/remote?q=foobar", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });

    it("should render page no results", async (t) => {
      using _ = stub(globalThis, "fetch", (url) => {
        if (url.toString().includes("https://itunes.apple.com/search")) {
          return Promise.resolve(Response.json({
            resultCount: 0,
            results: [],
          }));
        }

        return Promise.resolve(
          new Response(
            `<head><meta property="og:image" content="https://foo.com" /></head>`,
          ),
        );
      });

      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists/remote?q=foobar", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/artists/remote");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should handle no results", async () => {
    using _ = stub(globalThis, "fetch", (url) => {
      if (url.toString().includes("https://itunes.apple.com/search")) {
        return Promise.resolve(Response.json({
          resultCount: 0,
          results: [],
        }));
      }

      return Promise.resolve(
        new Response(
          `<head><meta property="og:image" content="https://foo.com" /></head>`,
        ),
      );
    });

    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists/remote?q=foo", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main p");
    testUtils.assertSeeText(
      dom,
      "No remote artists found",
      "body main p",
    );
  });

  it("should handle results", async () => {
    testFixtures.loadArtist(db, { id: 2, name: "fiz" });

    using _ = stub(globalThis, "fetch", (url) => {
      if (url.toString().includes("https://itunes.apple.com/search")) {
        return Promise.resolve(Response.json({
          resultCount: 2,
          results: [{
            wrapperType: "foo",
            artistType: "foo",
            artistName: "foo bar",
            artistLinkUrl: "https://foo.bar",
            artistId: 1,
            amgArtistId: 1,
            primaryGenreName: "foo",
            primaryGenreId: 1,
          }, {
            wrapperType: "fiz",
            artistType: "fiz",
            artistName: "fiz bar",
            artistLinkUrl: "https://fiz.bar",
            artistId: 2,
            amgArtistId: 2,
            primaryGenreName: "fiz",
            primaryGenreId: 2,
          }],
        }));
      }

      return Promise.resolve(
        new Response(
          `<head><meta property="og:image" content="${url.toString()}/100x100.png" /></head>`,
        ),
      );
    });

    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists/remote?q=foo", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main > :nth-child(2).container .row");
    testUtils.assertSeeInOrder(dom, [
      '<img class="img-fluid rounded me-sm-5" src="https://foo.bar/256x256.png"',
      '<button type="submit" class="btn btn-outline-primary">Subscribe',
      '<img class="img-fluid rounded me-sm-5" src="https://fiz.bar/256x256.png"',
      '<button type="submit" class="btn btn-outline-primary" disabled="">Subscribe',
    ], "body main > :nth-child(2).container .row");
    testUtils.assertSeeTextInOrder(
      dom,
      ["foo bar", "fiz bar"],
      "body main > :nth-child(2).container .row",
    );
  });
});

describe("POST /artists/remote", () => {
  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/artists/remote", {
      method: "post",
      headers: { origin: "http://localhost" },
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should flash error if invalid data provided", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/remote", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/remote",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: new URLSearchParams({ name: "foo", image: "foo.bar.com" }),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/remote",
    );

    const res = await app.request("/artists/remote", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-danger");
    testUtils.assertSeeText(
      dom,
      "Validation failure",
      "body #flash-messages .alert-danger",
    );
  });

  it("should flash error if invalid data provided", async () => {
    const originalSql = db.sql.bind(db);
    using _ = stub(CustomDatabase.prototype, "sql", (...args) => {
      if ((args[0]?.[0] ?? "").includes("accounts")) {
        return originalSql(...args);
      }

      return [];
    });

    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/remote", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/remote",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: new URLSearchParams({ id: "1", name: "foo", image: "foo.bar.com" }),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "/artists/remote",
    );

    const res = await app.request("/artists/remote", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-danger");
    testUtils.assertSeeText(
      dom,
      'Could not subscribe to "foo"',
      "body #flash-messages .alert-danger",
    );
  });

  it("should flash success if it was sucessfull at subscribing", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/remote", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/remote",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: new URLSearchParams({ id: "1", name: "foo", image: "foo.bar.com" }),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "/artists",
    );

    const res = await app.request("/artists", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res);
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-success");
    testUtils.assertSeeText(
      dom,
      'Subscribed to "foo" successfully',
      "body #flash-messages .alert-success",
    );
  });
});
