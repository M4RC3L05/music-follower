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
import { assertEquals } from "@std/assert";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
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
  db.exec("delete from accounts");
  testFixtures.loadAccount(db);
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  memStore.data.clear();
});

afterAll(() => {
  db.close();
});

describe("GET /", () => {
  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should render the home page", async (t) => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/", { headers: { cookie: auth.sid } });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 200);
    await testUtils.expectHtmlSnapshot(t, dom, "body main");
  });
});
