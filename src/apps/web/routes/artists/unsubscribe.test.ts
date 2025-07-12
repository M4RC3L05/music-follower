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

describe("POST /artists/:id/unsubscribe", () => {
  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/1/unsubscribe", {
      method: "post",
      headers: { origin: "http://localhost" },
    });
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should should flash error if no artist is found", async () => {
    const postRes = await testUtils.requestAuth(app, "/artists/1/unsubscribe", {
      redirect: "follow",
      method: "post",
      headers: {
        referer: "http://localhost/artists",
        origin: "http://localhost",
      },
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
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-danger");
    testUtils.assertSeeText(
      dom,
      "No artist found to unsubscribe",
      "body #flash-messages",
    );
  });

  it("should should unsubscribe artist", async () => {
    const artist = testFixtures.loadArtist(db, { name: "foobar" });
    const postRes = await testUtils.requestAuth(
      app,
      `/artists/${artist.id}/unsubscribe`,
      {
        redirect: "follow",
        method: "post",
        headers: {
          referer: "http://localhost/artists",
          origin: "http://localhost",
        },
      },
    );

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
    testUtils.assertNodeExists(dom, "body #flash-messages .alert-success");
    testUtils.assertSeeText(
      dom,
      `Unsubscribed to ${artist.name} successfully`,
      "body #flash-messages",
    );
  });
});
