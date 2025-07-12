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
  db.exec("delete from releases");
});

afterAll(() => {
  db.close();
});

describe("POST /releases/:id/:type/state", () => {
  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/releases/1/b/state", {
      method: "post",
      headers: { origin: "http://localhost" },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should redirect on invalid params provided", async () => {
    const postRes = await testUtils.requestAuth(app, "/releases/a/b/state", {
      redirect: "follow",
      method: "post",
      headers: { origin: "http://localhost" },
    });

    assertEquals(postRes.status, 302);
    assertEquals(postRes.headers.get("location"), "/");

    const res = await testUtils.requestAuth(app, "/", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertSeeText(
      dom,
      "Validation failure",
      "body #flash-messages",
    );
  });

  it("should redirect on release not found", async () => {
    const postRes = await testUtils.requestAuth(app, "/releases/1/b/state", {
      redirect: "follow",
      method: "post",
      body: new URLSearchParams({ "option": "feed", "state": "show" }),
      headers: { origin: "http://localhost" },
    });

    assertEquals(postRes.status, 302);
    assertEquals(postRes.headers.get("location"), "/releases/1/b");

    testFixtures.loadRelease(db, { id: 1, type: "b" });
    const res = await testUtils.requestAuth(app, "/releases/1/b", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertSeeText(
      dom,
      "Release not found",
      "body #flash-messages",
    );
  });

  it("should update release hidden status", async () => {
    testFixtures.loadRelease(db, { id: 1, type: "b" });

    const postRes = await testUtils.requestAuth(app, "/releases/1/b/state", {
      redirect: "follow",
      method: "post",
      body: new URLSearchParams({ "option": "feed", "state": "hide" }),
      headers: { origin: "http://localhost" },
    });

    assertEquals(postRes.status, 302);
    assertEquals(postRes.headers.get("location"), "/releases/1/b");

    const res = await testUtils.requestAuth(app, "/releases/1/b", {
      // deno-lint-ignore ban-ts-comment
      // @ts-ignore
      headers: { "cookie": postRes.headers.get("set-cookie") },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    testUtils.assertSee(
      dom,
      '<button type="submit" class="btn btn-outline-primary">Hidden Feed <i class="bi bi-check-square"></i></button>',
      "body",
    );
  });
});
