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

describe("GET /api/artists", () => {
  it("should throw a 422 if invalid query params provided", async () => {
    const response = await app.request(
      "/api/releases?q=&page=foo&limit=bar",
      {
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
          field: "page",
          message: "The page field must be a number",
          rule: "number",
        }, {
          field: "limit",
          message: "The limit field must be a number",
          rule: "number",
        }],
      },
    });
  });

  it("should search by artist name", async () => {
    const first = testFixtures.loadArtist(db, { name: "bar" });
    const second = testFixtures.loadArtist(db, { name: "biz" });
    testFixtures.loadArtist(db, { name: "foo" });

    const response = await app.request(
      "/api/artists?q=b",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [{ ...first, totalItems: 2 }, { ...second, totalItems: 2 }],
      pagination: { previous: 0, next: 0, total: 2, limit: 12 },
    });
  });

  it("should paginate artists", async () => {
    const first = testFixtures.loadArtist(db, { name: "a" });
    const second = testFixtures.loadArtist(db, { name: "b" });
    const third = testFixtures.loadArtist(db, { name: "c" });

    {
      const response = await app.request(
        "/api/artists?page=0&limit=2",
        {
          headers: {
            "authorization": `Basic ${encodeBase64("foo:bar")}`,
          },
        },
      );
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data, {
        data: [{ ...first, totalItems: 3 }, { ...second, totalItems: 3 }],
        pagination: { previous: 0, next: 1, total: 3, limit: 2 },
      });
    }

    {
      const response = await app.request(
        "/api/artists?page=1&limit=2",
        {
          headers: {
            "authorization": `Basic ${encodeBase64("foo:bar")}`,
          },
        },
      );
      const data = await response.json();

      assertEquals(response.status, 200);
      assertEquals(data, {
        data: [{ ...third, totalItems: 3 }],
        pagination: { previous: 0, next: 1, total: 3, limit: 2 },
      });
    }
  });
});
