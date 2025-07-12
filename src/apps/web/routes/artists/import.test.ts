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
  db.exec("delete from artists");
});

afterAll(() => {
  db.close();
});

describe("GET /artists/import", () => {
  describe("snapshots", () => {
    it("should render imports artists page", async (t) => {
      const res = await testUtils.requestAuth(app, "/artists/import");
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body main");
    });
  });

  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/import");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });
});

describe("POST /artists/import", () => {
  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/import", {
      method: "post",
      body: new FormData(),
      headers: { origin: "http://localhost" },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should redirect and display form errors if no file is provided", async () => {
    const postRes = await testUtils.requestAuth(app, "/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
      },
      body: new FormData(),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/import",
    );

    const res = await testUtils.requestAuth(app, "/artists/import", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main form #file + .invalid-feedback");
    testUtils.assertSeeText(
      dom,
      "Must provided a artists file",
      "body main form #file + .invalid-feedback",
    );
  });

  it("should redirect and display form errors if the file is too large", async () => {
    const fd = new FormData();
    fd.set("file", testFixtures.maxArtistsImportPayload);

    const postRes = await testUtils.requestAuth(app, "/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
      },
      body: fd,
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/import",
    );

    const res = await testUtils.requestAuth(app, "/artists/import", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body #flash-messages");
    testUtils.assertSeeText(
      dom,
      "File size exceeds maximum allowed size of 104857600 bytes",
      "body #flash-messages",
    );
  });

  it("should redirect and display form errors if the file is not gzip", async () => {
    const fd = new FormData();
    fd.set("file", testFixtures.generateInavlidArtistsFileExport());

    const postRes = await testUtils.requestAuth(app, "/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
      },
      body: fd,
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/import",
    );

    const res = await testUtils.requestAuth(app, "/artists/import", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body main form #file + .invalid-feedback");
    testUtils.assertSeeText(
      dom,
      "File type is invalid",
      "body main form #file + .invalid-feedback",
    );
  });

  it("should import artists", async () => {
    const fd = new FormData();
    fd.set(
      "file",
      await testFixtures.generateArtistsFileExport([{
        id: 1,
        name: "1 - artists - foo",
        image: "https://foo.com",
      }, {
        id: 2,
        name: "2 - artists - bar",
        image: "https://bar.com",
      }]),
    );

    const postRes = await testUtils.requestAuth(app, "/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
      },
      body: fd,
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

    assertEquals(res.status, 200);
    testUtils.assertNodeExists(dom, "body #flash-messages");
    testUtils.assertSeeText(
      dom,
      "Successfully imported 2 artist(s)",
      "body #flash-messages",
    );
    testUtils.assertSeeInOrder(
      dom,
      ["1 - artists - foo", "2 - artists - bar"],
      "body main",
    );
  });
});
