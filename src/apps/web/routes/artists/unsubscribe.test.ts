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

describe("POST /artists/:id/unsubscribe", () => {
  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/artists/1/unsubscribe", {
      method: "post",
      headers: { origin: "http://localhost" },
    });

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should should flash error if no artist is found", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request("/artists/1/unsubscribe", {
      redirect: "follow",
      method: "post",
      headers: {
        cookie: auth.sid,
        referer: "http://localhost/artists",
        origin: "http://localhost",
      },
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
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-danger");
    testUtils.assertSeeText(
      dom,
      "No artist found to unsubscribe",
      "body #flash-messages",
    );
  });

  it("should unsubscribe artist", async () => {
    const artist = testFixtures.loadArtist(db, { name: "foobar" });

    const auth = await testUtils.authenticateRequest(app);
    const postRes = await app.request(
      `/artists/${artist.id}/unsubscribe`,
      {
        redirect: "follow",
        method: "post",
        headers: {
          referer: "http://localhost/artists",
          origin: "http://localhost",
          cookie: auth.sid,
        },
      },
    );

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
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-success");
    testUtils.assertSeeText(
      dom,
      `Unsubscribed to ${artist.name} successfully`,
      "body #flash-messages",
    );
  });
});
