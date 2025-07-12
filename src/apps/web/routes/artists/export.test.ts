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
import { assertArrayIncludes, assertEquals } from "@std/assert";
import { fileTypeFromBuffer } from "file-type";
import { JsonParseStream } from "@std/json";
import { TextLineStream } from "@std/streams";

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

describe("GET /artists/export", () => {
  it("should return an error page if not authenticated", async () => {
    const res = await app.request("/artists/export");
    const dom = await testUtils.getDom(res);

    assertEquals(res.status, 401);
    testUtils.assertSeeText(dom, "Unauthorized", "body");
  });

  it("should return empty body if no artists are present", async () => {
    const res = await testUtils.requestAuth(app, "/artists/export");

    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Content-Type"), "text/plain");
    assertEquals(
      res.headers.get("Content-Disposition"),
      'attachment; filename="artists.jsonl.gz"',
    );
    assertEquals(res.headers.get("X-Content-Type-Options"), "nosniff");

    const data = await res.bytes();

    assertEquals(
      (await fileTypeFromBuffer(data))?.mime,
      "application/gzip",
    );

    const content = await Array.fromAsync(
      ReadableStream.from([data])
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new JsonParseStream()),
    );

    assertEquals(content.length, 0);
  });

  it("should export artists in chunk", async () => {
    const artistOne = testFixtures.loadArtist(db, {
      id: 1,
      name: "foo",
      image: "https://foo",
    });
    const artistTwo = testFixtures.loadArtist(db, {
      id: 2,
      name: "bar",
      image: "https://bar",
    });

    const res = await testUtils.requestAuth(app, "/artists/export");

    assertEquals(res.status, 200);
    assertEquals(res.headers.get("Content-Type"), "text/plain");
    assertEquals(
      res.headers.get("Content-Disposition"),
      'attachment; filename="artists.jsonl.gz"',
    );
    assertEquals(res.headers.get("X-Content-Type-Options"), "nosniff");

    const data = await res.bytes();

    assertEquals(
      (await fileTypeFromBuffer(data))?.mime,
      "application/gzip",
    );

    const content = await Array.fromAsync(
      ReadableStream.from([data])
        .pipeThrough(new DecompressionStream("gzip"))
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new JsonParseStream()),
    );

    assertEquals(content.length, 2);
    assertArrayIncludes(content, [artistOne, artistTwo]);
  });
});
