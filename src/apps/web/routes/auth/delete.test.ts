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
import { assertEquals, assertExists } from "@std/assert";
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

describe("POST /auth/delete", () => {
  it("should redirect to login if not authenticated", async () => {
    const res = await app.request("/auth/delete", {
      method: "post",
      headers: { origin: "http://localhost" },
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should delete the account and logout", async () => {
    const auth = await testUtils.authenticateRequest(app);
    assertExists(
      memStore.getSessionById(auth.sid.replace("sid=", ""))?._data.account,
    );

    const res = await app.request("/auth/delete", {
      method: "post",
      headers: { cookie: auth.sid, origin: "http://localhost" },
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/register");
    assertEquals(
      memStore.getSessionById(auth.sid.replace("sid=", ""))?._data.account,
      undefined,
    );
    assertEquals(db.sql`select * from accounts;`.length, 0);

    const res2 = await app.request("/auth/register", {
      headers: { cookie: auth.sid },
    });
    const dom = await testUtils.getDom(res2);

    assertEquals(res2.status, 200);
    testUtils.assertSeeText(
      dom,
      "Successfull deleted account, you will need to setup a new one.",
      "body #flash-messages",
    );
  });
});
