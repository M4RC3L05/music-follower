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

describe("GET /auth/login", () => {
  describe("snapshots", () => {
    it("should render login page", async (t) => {
      const res = await app.request("/auth/login");
      const dom = await testUtils.getDom(res);

      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });

    it("should render login page with form errors", async (t) => {
      const postRes = await app.request("/auth/login", {
        method: "post",
        headers: { origin: "http://localhost" },
        body: new URLSearchParams({ username: "", password: "" }),
      });

      const res = await app.request("/auth/login", {
        headers: { cookie: postRes.headers.get("set-cookie")! },
      });
      const dom = await testUtils.getDom(res);

      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should show the login form", async () => {
    const res = await app.request("/auth/login");
    const dom = await testUtils.getDom(res);

    testUtils.assertSeeInOrder(dom, [
      '<input name="username"',
      '<input name="password"',
      '<input type="submit" value="Login"',
    ], "body main");
  });

  it("should show login form with form errors if invalid data provided", async () => {
    const postRes = await app.request("/auth/login", {
      method: "post",
      headers: { origin: "http://localhost" },
      body: new URLSearchParams({ username: "", password: "" }),
    });

    const res = await app.request("/auth/login", {
      headers: { cookie: postRes.headers.get("set-cookie")! },
    });
    const dom = await testUtils.getDom(res);

    testUtils.assertSeeInOrder(dom, [
      '<input name="username"',
      '<div id="username-validation-feedback"',
      '<input name="password"',
      '<div id="password-validation-feedback"',
      '<input type="submit" value="Login"',
    ], "body main");
    testUtils.assertSeeTextInOrder(dom, [
      "The username field must be defined",
      "The password field must be defined",
    ], "body main");
  });
});

describe("POST /auth/login", () => {
  it("should flash error if no account exists with the given username", async () => {
    const res = await app.request("/auth/login", {
      method: "post",
      headers: { origin: "http://localhost" },
      body: new URLSearchParams({ username: "bizbiz", password: "foobarbiz" }),
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");

    const res2 = await app.request("/auth/login", {
      headers: { cookie: res.headers.get("set-cookie")! },
    });
    const dom = await testUtils.getDom(res2);

    assertEquals(res2.status, 200);
    testUtils.assertSeeText(
      dom,
      "Not matching username or password",
      "body #flash-messages",
    );
  });

  it("should flash error if passwords do not match", async () => {
    const res = await app.request("/auth/login", {
      method: "post",
      headers: { origin: "http://localhost" },
      body: new URLSearchParams({ username: "foo", password: "foobarbiz" }),
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");

    const res2 = await app.request("/auth/login", {
      headers: { cookie: res.headers.get("set-cookie")! },
    });
    const dom = await testUtils.getDom(res2);

    assertEquals(res2.status, 200);
    testUtils.assertSeeText(
      dom,
      "Not matching username or password",
      "body #flash-messages",
    );
  });

  it("should login", async () => {
    const res = await app.request("/auth/login", {
      method: "post",
      headers: { origin: "http://localhost" },
      body: new URLSearchParams({ username: "foo", password: "bar" }),
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/");

    const res2 = await app.request("/", {
      headers: { cookie: res.headers.get("set-cookie")! },
    });
    const dom = await testUtils.getDom(res2);

    assertEquals(res2.status, 200);
    testUtils.assertSeeText(
      dom,
      "Successfull login",
      "body #flash-messages",
    );
  });
});
