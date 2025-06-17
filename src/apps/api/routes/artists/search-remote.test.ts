import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { testDbUtils } from "#src/common/utils/mod.ts";
import type { Hono } from "@hono/hono";
import { makeApp } from "#src/apps/api/app.ts";
import { encodeBase64 } from "@std/encoding/base64";
import { assertSpyCallArg, assertSpyCalls, stub } from "@std/testing/mock";
import config from "config";

let app: Hono;
let db: CustomDatabase;
const artistPlaceholderImage = config.get<string>("media.placeholderImage");

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

describe("GET /api/artists/remote", () => {
  it("should throw 422 if no query is provided", async () => {
    const response = await app.request("/api/artists/remote", {
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
          field: "q",
          message: "The q field must be defined",
          rule: "required",
        }],
      },
    });
  });

  it("should throw 422 if query is invalid", async () => {
    const response = await app.request("/api/artists/remote?q=", {
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
          field: "q",
          message: "The q field must have at least 1 characters",
          meta: { min: 1 },
          rule: "minLength",
        }],
      },
    });
  });

  it("should fetch remote artists and their pictures, fallbacking to placeholder if not available", async () => {
    const remoteArtist = testFixtures.generateItunesArtistsSearchResultItem({
      artistId: 1,
      artistLinkUrl: "foo",
    });
    const remoteArtistRemoteArtistImage = testFixtures
      .generateItunesArtistsSearchResultItem({
        artistId: 2,
        artistLinkUrl: "bar:ok",
      });
    const remoteArtistRemoteArtistImageNoMatch = testFixtures
      .generateItunesArtistsSearchResultItem({
        artistId: 2,
        artistLinkUrl: "bar:no",
      });
    const remoteArtistRemoteArtistImageNoMatchAppleMusic = testFixtures
      .generateItunesArtistsSearchResultItem({
        artistId: 2,
        artistLinkUrl: "bar:no-match-apple-music",
      });
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    using fetchStub = stub(globalThis, "fetch", (input) => {
      if (input.toString().includes("itunes.apple.com")) {
        return Promise.resolve(
          Response.json(
            testFixtures.generateItunesArtistsSearchResult(
              remoteArtist,
              remoteArtistRemoteArtistImage,
              remoteArtistRemoteArtistImageNoMatch,
              remoteArtistRemoteArtistImageNoMatchAppleMusic,
            ),
            {
              status: 200,
            },
          ),
        );
      }

      if (input.toString().includes("bar")) {
        return Promise.resolve(
          new Response(
            input.toString().includes(":ok")
              ? '<html><meta property="og:image" content="https://exmaple.com/image.png" /></html>'
              : input.toString().includes(":no-match-apple-music")
              ? '<html><meta property="og:image" content="https://exmaple.com/apple-music-image.png" /></html>'
              : '<html><meta property="og:image" /></html>',
            { status: 200 },
          ),
        );
      }
    });

    const response = await app.request("/api/artists/remote?q=foo", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [{
        ...remoteArtist,
        isSubscribed: false,
        image: artistPlaceholderImage,
      }, {
        ...remoteArtistRemoteArtistImage,
        isSubscribed: false,
        image: "https://exmaple.com/256x256.png",
      }, {
        ...remoteArtistRemoteArtistImageNoMatch,
        isSubscribed: false,
        image: artistPlaceholderImage,
      }, {
        ...remoteArtistRemoteArtistImageNoMatchAppleMusic,
        isSubscribed: false,
        image: artistPlaceholderImage,
      }],
    });
    assertSpyCalls(fetchStub, 5);
    assertSpyCallArg(
      fetchStub,
      0,
      0,
      "https://itunes.apple.com/search?term=foo&entity=musicArtist&limit=8",
    );
    assertExists(fetchStub.calls[0]?.args[1]?.signal);
    assertSpyCallArg(fetchStub, 1, 0, "foo");
    assertExists(fetchStub.calls[1]?.args[1]?.signal);
    assertSpyCallArg(fetchStub, 2, 0, "bar:ok");
    assertExists(fetchStub.calls[2]?.args[1]?.signal);
    assertSpyCallArg(fetchStub, 3, 0, "bar:no");
    assertExists(fetchStub.calls[3]?.args[1]?.signal);
    assertSpyCallArg(fetchStub, 4, 0, "bar:no-match-apple-music");
  });

  it("should indicate if a remote artist is already on db", async () => {
    const remoteArtist = testFixtures.generateItunesArtistsSearchResultItem({
      artistId: 1,
    });
    const remoteArtistNotSub = testFixtures
      .generateItunesArtistsSearchResultItem({ artistId: 2 });
    testFixtures.loadArtist(db, { id: 1 });

    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    using _ = stub(globalThis, "fetch", (input) => {
      if (input.toString().includes("itunes.apple.com")) {
        return Promise.resolve(
          Response.json(
            testFixtures.generateItunesArtistsSearchResult(
              remoteArtist,
              remoteArtistNotSub,
            ),
            { status: 200 },
          ),
        );
      }

      return new Response(null, { status: 204 });
    });

    const response = await app.request("/api/artists/remote?q=foo", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: [{
        ...remoteArtist,
        isSubscribed: true,
        image: artistPlaceholderImage,
      }, {
        ...remoteArtistNotSub,
        isSubscribed: false,
        image: artistPlaceholderImage,
      }],
    });
  });
});
