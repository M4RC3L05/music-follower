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

describe("GET /artists/import", () => {
  describe("snapshots", () => {
    it("should render imports artists page", async (t) => {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/artists/import", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom, "body main");
    });
  });

  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/import");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });
});

describe("POST /artists/import", () => {
  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/artists/import", {
      method: "post",
      body: new FormData(),
      headers: { origin: "http://localhost" },
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should redirect and display form errors if no file is provided", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: new FormData(),
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/import",
    );

    const res = await app.request("/artists/import", {
      headers: { cookie: auth.sid },
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

    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: fd,
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/import",
    );

    const res = await app.request("/artists/import", {
      headers: { cookie: auth.sid },
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

    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: fd,
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "http://localhost/artists/import",
    );

    const res = await app.request("/artists/import", {
      headers: { cookie: auth.sid },
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

    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/import", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists/import",
        origin: "http://localhost",
        cookie: auth.sid,
      },
      body: fd,
    });

    assertEquals(postRes.status, 302);
    assertEquals(
      postRes.headers.get("location"),
      "/artists",
    );

    const res = await app.request("/artists", {
      headers: { "cookie": auth.sid },
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
