import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { testDbUtils, testUtils } from "#src/common/utils/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
import type { Hono } from "@hono/hono";
import { assertEquals } from "@std/assert";

let app: Hono;
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  app = makeApp({ database: db });
});

afterAll(() => {
  db.close();
});

describe("GET /", () => {
  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should render the home page", async (t) => {
    const res = await testUtils.requestAuth(app, "/");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    await testUtils.expectHtmlSnapshot(t, dom, "body main");
  });
});
