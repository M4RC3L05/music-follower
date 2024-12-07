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

describe("POST /api/artists/import", () => {
  it("should throw 422 if not file was submitted", async () => {
    const formData = new FormData();
    const response = await app.request("/api/artists/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Must provided a artists file",
      },
    });
  });

  it("should throw 422 if file is too big", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.maxArtistsImportPayload);

    const response = await app.request("/api/artists/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "File size must not excceed 3145728 bytes",
      },
    });
  });

  it("should do nothing if no data key exists in file", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File(
        [JSON.stringify({})],
        "foo.json",
        {
          type: "text/plain",
        },
      ),
    );

    const response = await app.request("/api/artists/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
  });

  it("should do nothing if data key is not an array", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new File(
        [JSON.stringify({ data: true })],
        "foo.json",
        {
          type: "text/plain",
        },
      ),
    );

    const response = await app.request("/api/artists/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
  });

  it("should handle no artists in file", async () => {
    const formData = new FormData();
    formData.append("file", testFixtures.generateArtistsFileExport([]));

    const response = await app.request("/api/artists/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);

    const artistsStored = db.sql`select * from artists order by id asc`;
    assertEquals(artistsStored.length, 0);
  });

  it("should handle import file", async () => {
    const artists = [{
      id: 1,
      imageUrl: "https://foo.com",
      name: "biz",
    }, {
      id: 2,
      imageUrl: "https://foo.biz",
      name: "buz",
    }];
    const formData = new FormData();
    formData.append(
      "file",
      testFixtures.generateArtistsFileExport(artists),
    );

    const response = await app.request("/api/artists/import", {
      method: "POST",
      body: formData,
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.bytes();

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);

    const artistsStored = db.sql`select * from artists order by id asc`;
    assertEquals(artistsStored.length, 2);
    assertEquals(artistsStored, artists);
  });
});
