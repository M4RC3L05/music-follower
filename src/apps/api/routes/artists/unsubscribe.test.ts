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

describe("DELETE /api/artists/:id", () => {
  it("should throw a 422 if invalid param provided", async () => {
    const response = await app.request(
      "/api/artists/foo",
      {
        method: "DELETE",
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [{
          field: "id",
          message: "The id field must be a number",
          rule: "number",
        }],
      },
    });
  });

  it("should throw a 404 if no artists found", async () => {
    const response = await app.request(
      "/api/artists/1",
      {
        method: "DELETE",
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 404);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Artists not found",
      },
    });
  });

  it("should unsubscribe an artist", async () => {
    const artist = testFixtures.loadArtist(db);

    const response = await app.request(
      `/api/artists/${artist.id}`,
      {
        method: "DELETE",
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(db.sql`select * from artists`.length, 0);
  });
});
