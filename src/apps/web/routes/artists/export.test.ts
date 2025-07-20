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
import { MemoryStore } from "@jcs224/hono-sessions";

let app: Hono;
let db: CustomDatabase;
let memStore: MemoryStore;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  memStore = new MemoryStore();
  app = makeApp({ database: db, sessioStore: memStore });
});

beforeEach(() => {
  db.exec("delete from artists");
  db.exec("delete from accounts");
  testFixtures.loadAccount(db);
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  memStore.data.clear();
});

afterAll(() => {
  db.close();
});

describe("GET /artists/export", () => {
  it("should redirect to login page if not authenticated", async () => {
    const res = await app.request("/artists/export");

    assertEquals(res.status, 302);
    assertEquals(res.headers.get("location"), "/auth/login");
  });

  it("should return empty body if no artists are present", async () => {
    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists/export", {
      headers: { cookie: auth.sid },
    });

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

    const auth = await testUtils.authenticateRequest(app);
    const res = await app.request("/artists/export", {
      headers: { cookie: auth.sid },
    });

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
