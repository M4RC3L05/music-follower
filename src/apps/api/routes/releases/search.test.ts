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

describe("GET /api/releases", () => {
  it("should throw a 422 if invalid query params provided", async () => {
    const response = await app.request(
      "/api/releases?hidden=foo&notHidden=bar&page=foo&limit=bar",
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
          field: "hidden",
          message: "The selected hidden is invalid",
          meta: { choices: ["feed", "admin"] },
          rule: "enum",
        }, {
          field: "notHidden",
          message: "The selected notHidden is invalid",
          meta: { choices: ["feed", "admin"] },
          rule: "enum",
        }, {
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

  it("should search by artist name or release name", async () => {
    const first = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 4000).toISOString(),
      name: "foo",
      artistName: "bar",
    });
    const second = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 3000).toISOString(),
      name: "bar",
      artistName: "foo",
    });
    testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 2000).toISOString(),
      name: "biz",
      artistName: "buz",
    });

    const response = await app.request(
      "/api/releases?q=fo",
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

  it("should search by hidden", async () => {
    const first = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 4000).toISOString(),
      hidden: JSON.stringify(["feed"]),
    });
    testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 3000).toISOString(),
      hidden: JSON.stringify(["admin"]),
    });

    const response = await app.request(
      "/api/releases?hidden=feed",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [{ ...first, totalItems: 1 }],
      pagination: { previous: 0, next: 0, total: 1, limit: 12 },
    });
  });

  it("should search by not hidden", async () => {
    testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 4000).toISOString(),
      hidden: JSON.stringify(["feed"]),
    });
    const second = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 3000).toISOString(),
      hidden: JSON.stringify(["admin"]),
    });

    const response = await app.request(
      "/api/releases?notHidden=feed",
      {
        headers: {
          "authorization": `Basic ${encodeBase64("foo:bar")}`,
        },
      },
    );
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [{ ...second, totalItems: 1 }],
      pagination: { previous: 0, next: 0, total: 1, limit: 12 },
    });
  });

  it("should paginate releases", async () => {
    const first = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 4000).toISOString(),
    });
    const second = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 3000).toISOString(),
    });
    const third = testFixtures.loadRelease(db, {
      releasedAt: new Date(Date.now() + 2000).toISOString(),
    });

    {
      const response = await app.request(
        "/api/releases?page=0&limit=2",
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
        "/api/releases?page=1&limit=2",
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
