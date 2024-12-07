import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { testDbUtils } from "#src/common/utils/mod.ts";
import type { Hono } from "@hono/hono";
import { makeApp } from "#src/apps/api/app.ts";
import { encodeBase64 } from "@std/encoding/base64";

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

describe("GET /api/artists/export", () => {
  it("should export without artists", async () => {
    const response = await app.request("/api/artists/export", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "application/json");
    assertEquals(
      response.headers.get("content-disposition"),
      'attachment; filename="artists.json"',
    );
    assertEquals(data, { data: [] });
  });

  it("should export with artists", async () => {
    const artist = testFixtures.loadArtist(db);

    const response = await app.request("/api/artists/export", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(response.headers.get("content-type"), "application/json");
    assertEquals(
      response.headers.get("content-disposition"),
      'attachment; filename="artists.json"',
    );
    assertEquals(data, { data: [artist] });
  });
});
