import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
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

describe("POST /api/artists", () => {
  it("should throw a 422 if no data is provided", async () => {
    const response = await app.request(
      "/api/artists",
      {
        method: "POST",
        body: JSON.stringify({}),
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
          message: "The id field must be defined",
          rule: "required",
        }, {
          field: "name",
          message: "The name field must be defined",
          rule: "required",
        }, {
          field: "image",
          message: "The image field must be defined",
          rule: "required",
        }],
      },
    });
  });

  it("should throw a 422 if invalid data is provided", async () => {
    const response = await app.request(
      "/api/artists",
      {
        method: "POST",
        body: JSON.stringify({ id: "foo", name: 1, image: "bar", biz: 2 }),
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
        }, {
          field: "name",
          message: "The name field must be a string",
          rule: "string",
        }, {
          field: "image",
          message: "The image field must be a valid URL",
          rule: "url",
        }],
      },
    });
  });

  it("should subscribe a artist", async () => {
    const response = await app.request(
      "/api/artists",
      {
        method: "POST",
        body: JSON.stringify({ id: 1, name: "foo", image: "https://foo.com" }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 201);
    assertEquals(data, {
      data: { id: 1, name: "foo", imageUrl: "https://foo.com" },
    });
  });
});
