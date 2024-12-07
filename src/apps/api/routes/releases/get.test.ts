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

describe("GET /api/releases/:id/:type", () => {
  it("should throw a 422 if invalid params provided", async () => {
    const response = await app.request("/api/releases/foo/1", {
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

  it("should throw a 404 if no release is found", async () => {
    const response = await app.request("/api/releases/1/foo", {
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

  it("should send a release by id", async () => {
    const release = testFixtures.loadRelease(db);

    const response = await app.request(
      `/api/releases/${release.id}/${release.type}`,
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: release });
  });
});
