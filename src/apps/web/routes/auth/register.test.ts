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
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  memStore.data.clear();
});

afterAll(() => {
  db.close();
});

describe("GET /auth/register", () => {
  describe("snapshots", () => {
    it("should render register page", async (t) => {
      const res = await app.request("/auth/register");
      const dom = await testUtils.getDom(res);

      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });

    it("should render register page with form errors", async (t) => {
      const postRes = await app.request("/auth/register", {
        method: "post",
        headers: { origin: "http://localhost" },
        body: new URLSearchParams({ username: "", password: "" }),
      });

      const res = await app.request("/auth/register", {
        headers: { cookie: postRes.headers.get("set-cookie")! },
      });
      const dom = await testUtils.getDom(res);

      await testUtils.expectHtmlSnapshot(t, dom, "body");
    });
  });

  it("should show the register form", async () => {
    const res = await app.request("/auth/register");
    const dom = await testUtils.getDom(res);

    testUtils.assertSeeInOrder(dom, [
      '<input name="username"',
      '<input name="password"',
      '<input type="submit" value="Register"',
    ], "body main");
  });

  it("should show register form with form errors if inavlid data provided", async () => {
    const postRes = await app.request("/auth/register", {
      method: "post",
      headers: { origin: "http://localhost" },
      body: new URLSearchParams({ username: "", password: "" }),
    });

    const res = await app.request("/auth/register", {
      headers: { cookie: postRes.headers.get("set-cookie")! },
    });
    const dom = await testUtils.getDom(res);

    testUtils.assertSeeInOrder(dom, [
      '<input name="username"',
      '<div id="username-validation-feedback"',
      '<input name="password"',
      '<div id="password-validation-feedback"',
      '<input type="submit" value="Register"',
    ], "body main");
    testUtils.assertSeeTextInOrder(dom, [
      "The username field must be defined",
      "The password field must be defined",
    ], "body main");
  });
});

describe("POST /auth/register", () => {
  it("should flash error if an account already exists", async () => {
    testFixtures.loadAccount(db);

    const res = await app.request("/auth/register", {
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
      "An account already exists",
      "body #flash-messages",
    );
  });

  it("should create a new account", async () => {
    const res = await app.request("/auth/register", {
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
      "Account created, you may login now",
      "body #flash-messages",
    );

    assertEquals(db.sql`select * from accounts`.length, 1);
  });
});
