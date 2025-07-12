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

let app: Hono;
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  app = makeApp({ database: db });
});

beforeEach(() => {
  db.exec("delete from artists");
});

afterAll(() => {
  db.close();
});

describe("GET /artists/remote", () => {
  describe("snapshot", () => {
    it("should render page without query", async (t) => {
      const res = await testUtils.requestAuth(app, "/artists/remote");
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

      const res = await testUtils.requestAuth(app, "/artists/remote?q=foobar");
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

      const res = await testUtils.requestAuth(app, "/artists/remote?q=foobar");
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/remote");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
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

    const res = await testUtils.requestAuth(app, "/artists/remote?q=foo");
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

    const res = await testUtils.requestAuth(app, "/artists/remote?q=foo");
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
  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/remote", {
      method: "post",
      headers: { origin: "http://localhost" },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should flash error if invalid data provided", async () => {
    const postRes = await testUtils.requestAuth(app, "/artists/remote", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/remote",
        origin: "http://localhost",
      },
      body: new URLSearchParams({ name: "foo", image: "foo.bar.com" }),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/remote",
    );

    const res = await testUtils.requestAuth(app, "/artists/remote", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
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
    using _ = stub(CustomDatabase.prototype, "sql", () => []);
    const postRes = await testUtils.requestAuth(app, "/artists/remote", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/remote",
        origin: "http://localhost",
      },
      body: new URLSearchParams({ id: "1", name: "foo", image: "foo.bar.com" }),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "/artists/remote",
    );

    const res = await testUtils.requestAuth(app, "/artists/remote", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
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
    const postRes = await testUtils.requestAuth(app, "/artists/remote", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/remote",
        origin: "http://localhost",
      },
      body: new URLSearchParams({ id: "1", name: "foo", image: "foo.bar.com" }),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "/artists",
    );

    const res = await testUtils.requestAuth(app, "/artists", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
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
