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
  db.exec("delete from releases");
});

afterAll(() => {
  db.close();
});

describe("PATCH /api/releases/:id/:type", () => {
  it("should throw a 422 if invalid params provided", async () => {
    const response = await app.request("/api/releases/foo/1", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
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

  it("should throw a 422 if no data provided", async () => {
    const response = await app.request("/api/releases/1/foo", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [{
          field: "hidden",
          message: "The hidden field must be defined",
          rule: "required",
        }],
      },
    });
  });

  it("should throw a 422 if invalid data provided", async () => {
    const response = await app.request("/api/releases/1/foo", {
      method: "PATCH",
      body: JSON.stringify({ hidden: true }),
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [{
          field: "hidden",
          message: "The hidden field must be an array",
          rule: "array",
        }],
      },
    });
  });

  it("should throw a 404 if no release is found", async () => {
    const response = await app.request("/api/releases/1/foo", {
      method: "PATCH",
      body: JSON.stringify({ hidden: [] }),
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 404);
    assertEquals(data, {
      error: { code: "error", message: "Could not find release" },
    });
  });

  it("should update a release", async () => {
    const release = testFixtures.loadRelease(db, {
      hidden: JSON.stringify(["admin"]),
    });

    const response = await app.request(
      `/api/releases/${release.id}/${release.type}`,
      {
        method: "PATCH",
        body: JSON.stringify({ hidden: ["feed"] }),
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );

    const [updated] = db
      .sql`select hidden from releases where id = ${release.id} and type = ${release.type}`;

    assertEquals(response.status, 204);
    assertEquals(updated?.hidden, JSON.stringify(["feed"]));
  });
});
