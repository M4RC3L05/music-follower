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
import { assertEquals, assertNotEquals } from "@std/assert";
import { MemoryStore } from "@jcs224/hono-sessions";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";

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
  db.exec("delete from accounts");
  testFixtures.loadAccount(db);
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  memStore.data.clear();
});

afterAll(() => {
  db.close();
});

describe("App", () => {
  describe("snapshots", () => {
    it("should render default layout correctly", async (t) => {
      const res = await app.request("/test/flash-messages");
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom);
    });

    it("should render default layout correctly loggedin", async (t) => {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/test/flash-messages", {
        headers: { cookie: auth.sid },
      });
      const dom = await testUtils.getDom(res);

      assertEquals(res.status, 200);
      await testUtils.expectHtmlSnapshot(t, dom);
    });
  });

  it("should redirect to login page if not authenticated", async () => {
    const response = await app.request("/");

    assertEquals(response.status, 302);
    assertEquals(response.headers.get("location"), "/auth/login");
  });

  it("should render a not found error page if route what not found", async () => {
    const response = await app.request("/not/found");
    const dom = await testUtils.getDom(response);

    assertEquals(response.status, 404);
    testUtils.assertNodeExists(dom, "main");
    testUtils.assertNodeNotExists(dom, "nav.navbar");
    testUtils.assertSeeInOrder(dom, [
      "<h1>Not found</h1>",
      '<a href="/">Go Home</a>',
    ], "body main");
  });

  it("should disable caching for not static routes", async () => {
    const response = await app.request("/test/index");

    assertEquals(response.status, 200);
    assertEquals(
      response.headers.get("cache-control"),
      "no-cache, no-store, must-revalidate",
    );
    assertEquals(response.headers.get("pragma"), "no-cache");
    assertEquals(response.headers.get("expires"), "0");

    const response2 = await app.request("/public/foo");

    assertNotEquals(
      response2.headers.get("cache-control"),
      "no-cache, no-store, must-revalidate",
    );
    assertNotEquals(response2.headers.get("pragma"), "no-cache");
    assertNotEquals(response2.headers.get("expires"), "0");
  });

  it("should check againt csrf", async () => {
    const response = await app.request("/test/index", {
      method: "post",
      body: new URLSearchParams({ "foo": "bar" }),
    });

    assertEquals(response.status, 403);

    const response2 = await app.request("/test/index", {
      method: "post",
      headers: {
        origin: "http://localhosts",
      },
      body: new URLSearchParams({ "foo": "bar" }),
    });

    assertEquals(response2.status, 403);

    const response3 = await app.request("/test/index", {
      method: "post",
      headers: {
        origin: "http://localhost",
      },
      body: new URLSearchParams({ "foo": "bar" }),
    });

    assertEquals(response3.status, 404);
  });

  it("should render flash messages", async (t) => {
    const res = await app.request("/test/flash-messages");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    await testUtils.expectHtmlSnapshot(t, dom, "#flash-messages");
  });

  it("should catch unknown errors and return 500", async (t) => {
    const res = await app.request("/test/error");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 500);
    await testUtils.expectHtmlSnapshot(t, dom, "body");
  });

  it("should catch http errors and return their status code and proxy any headers", async (t) => {
    const res = await app.request("/test/error?type=http");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 400);
    assertEquals(res.headers.get("x-foo"), "bar");
    await testUtils.expectHtmlSnapshot(t, dom, "body");
  });

  it("should catch http 422 errors and return their status code and refirect to referer is exists", async () => {
    {
      const res = await app.request("/test/error?type=http422");

      assertEquals(res.status, 302);
      assertEquals(res.headers.get("location"), "/");

      const res2 = await app.request("/test/index", {
        headers: { cookie: res.headers.get("set-cookie")! },
      });
      const dom2 = await testUtils.getDom(res2);
      assertEquals(res2.status, 200);
      testUtils.assertNodeExists(dom2, "body #flash-messages");
      testUtils.assertSeeText(dom2, "foo", "body #flash-messages");
    }

    {
      const res = await app.request("/test/error?type=http422", {
        headers: { "referer": "http://localhost/foo" },
      });

      assertEquals(res.status, 302);
      assertEquals(res.headers.get("location"), "http://localhost/foo");

      const res2 = await app.request("/test/index", {
        headers: { cookie: res.headers.get("set-cookie")! },
      });
      const dom2 = await testUtils.getDom(res2);
      assertEquals(res2.status, 200);
      testUtils.assertNodeExists(dom2, "body #flash-messages");
      testUtils.assertSeeText(dom2, "foo", "body #flash-messages");
    }
  });

  it("should catch validation errors and return 422 status code and refirect to referer is exists", async () => {
    {
      const res = await app.request("/test/error?type=valierr");

      const res2 = await app.request("/test/index", {
        headers: { cookie: res.headers.get("set-cookie")! },
      });
      const dom2 = await testUtils.getDom(res2);
      assertEquals(res2.status, 200);
      testUtils.assertNodeExists(dom2, "body #flash-messages");
      testUtils.assertSeeText(dom2, "foo", "body #flash-messages");
    }

    {
      const res = await app.request("/test/error?type=valierr", {
        headers: { "referer": "http://localhost/foo" },
      });

      assertEquals(res.status, 302);
      assertEquals(res.headers.get("location"), "http://localhost/foo");

      const res2 = await app.request("/test/index", {
        headers: { cookie: res.headers.get("set-cookie")! },
      });
      const dom2 = await testUtils.getDom(res2);
      assertEquals(res2.status, 200);
      testUtils.assertNodeExists(dom2, "body #flash-messages");
      testUtils.assertSeeText(dom2, "foo", "body #flash-messages");
    }
  });

  it("should catch MultipartParseError errors and return 422 status code and refirect to referer is exists", async () => {
    {
      const auth = await testUtils.authenticateRequest(app);
      const res = await app.request("/test/error?type=valierr", {
        headers: { cookie: auth.sid },
      });

      assertEquals(res.status, 302);
      assertEquals(res.headers.get("location"), "/");

      const res2 = await app.request("/test/index", {
        headers: { cookie: auth.sid },
      });
      const dom2 = await testUtils.getDom(res2);
      assertEquals(res2.status, 200);
      testUtils.assertNodeExists(dom2, "body #flash-messages");
      testUtils.assertSeeText(dom2, "foo", "body #flash-messages");
    }

    {
      const res = await app.request("/test/error?type=valierr", {
        headers: { "referer": "http://localhost/foo" },
      });

      assertEquals(res.status, 302);
      assertEquals(res.headers.get("location"), "http://localhost/foo");

      const res2 = await app.request("/test/index", {
        headers: { cookie: res.headers.get("set-cookie")! },
      });
      const dom2 = await testUtils.getDom(res2);
      testUtils.assertNodeExists(dom2, "body #flash-messages");
      testUtils.assertSeeText(dom2, "foo", "body #flash-messages");
    }
  });
});
