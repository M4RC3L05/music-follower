import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertEquals, assertIsError } from "@std/assert";
import { testDbUtils } from "#src/common/utils/mod.ts";
import runner from "#src/apps/jobs/sync-releases/app.ts";
import {
  assertSpyCallArg,
  assertSpyCallArgs,
  assertSpyCalls,
  spy,
  stub,
} from "@std/testing/mock";
import { makeLogger } from "#src/common/logger/mod.ts";
import { FakeTime } from "@std/testing/time";
import ms from "ms";
import type { SQLInputValue } from "node:sqlite";
import config from "#src/common/config/mod.ts";

const syncReleasesJobLog = makeLogger("sync-releases-job");
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);
});

beforeEach(() => {
  db.exec("delete from artists");
  db.exec("delete from releases");
});

afterAll(() => {
  db.close();
});

describe("runner()", () => {
  it("should not process if no artists exists", async () => {
    using fetchSpy = spy(globalThis, "fetch");

    await runner({ db, abort: new AbortController().signal });

    assertSpyCalls(fetchSpy, 0);
  });

  it("should not process if exists artists but the abort signal is aborted", async () => {
    const ac = new AbortController();

    testFixtures.loadArtist(db);

    using fetchSpy = spy(globalThis, "fetch");

    ac.abort();

    await runner({ db, abort: ac.signal });

    assertSpyCalls(fetchSpy, 0);
  });

  describe("getReleases()", () => {
    it("should log error if getting songs and albums failed", async () => {
      testFixtures.loadArtist(db);

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(new Response("error", { status: 400 }));
        }

        return Promise.resolve(new Response("error", { status: 401 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");
      using syncReleasesJobLogErrorSpy = spy(syncReleasesJobLog, "error");

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 3);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
        'Processing releases from "foo" at 1 of 1',
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Releases sync ended"]);
      assertSpyCalls(syncReleasesJobLogErrorSpy, 1);
      assertSpyCallArg(
        syncReleasesJobLogErrorSpy,
        0,
        0,
        "Could not get releases",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any).error,
        Error,
        "Releases request failed",
      );
      assertEquals(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause.code,
        "SONG_AND_ALBUM_RELEASES_REQUEST_FAILED",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .albumsCause,
        Error,
        "Error requesting lookup artists releases",
      );
      assertEquals(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .albumsCause
          .cause,
        401,
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .songsCause,
        Error,
        "Error requesting lookup artists releases",
      );
      assertEquals(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .songsCause
          .cause,
        400,
      );
    });

    it("should log warn if no releases are available", async () => {
      testFixtures.loadArtist(db);

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult("song"),
            ),
          );
        }
        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult("album"),
            ),
          );
        }
        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");
      using syncReleasesJobLogWarnSpy = spy(syncReleasesJobLog, "warn");

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 3);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
        'Processing releases from "foo" at 1 of 1',
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Releases sync ended"]);
      assertSpyCalls(syncReleasesJobLogWarnSpy, 1);
      assertSpyCallArg(
        syncReleasesJobLogWarnSpy,
        0,
        0,
        "No remote data found",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogWarnSpy.calls[0]?.args[1] as any).error,
        Error,
        "No releases",
      );
      assertEquals(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogWarnSpy.calls[0]?.args[1] as any).error.cause,
        { code: "NO_RELEASES_FOUND" },
      );
    });

    it("should retry 3 time if errors happens on remote requests", async () => {
      testFixtures.loadArtist(db);

      using timer = new FakeTime();
      using fetchStub = stub(globalThis, "fetch", () => {
        throw new Error("foo");
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");
      using syncReleasesJobLogErrorSpy = spy(syncReleasesJobLog, "error");

      const p = runner({ db, abort: new AbortController().signal });
      await timer.runAllAsync();
      await p;

      assertSpyCalls(fetchStub, 6);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 3);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
        'Processing releases from "foo" at 1 of 1',
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Releases sync ended"]);
      assertSpyCalls(syncReleasesJobLogErrorSpy, 1);
      assertSpyCallArg(
        syncReleasesJobLogErrorSpy,
        0,
        0,
        "Could not get releases",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any).error,
        Error,
        "Releases request failed",
      );
      assertEquals(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause.code,
        "SONG_AND_ALBUM_RELEASES_REQUEST_FAILED",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .albumsCause,
        Error,
        "Retrying exceeded the maxAttempts (3)",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .albumsCause
          .cause,
        Error,
        "foo",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .songsCause,
        Error,
        "Retrying exceeded the maxAttempts (3)",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any)!.error.cause
          .songsCause
          .cause,
        Error,
        "foo",
      );
    });

    describe("usableReleases()", () => {
      it("should exclude old releases", async () => {
        const maxMs = ms(config.apps.jobs.syncReleases.maxReleaseTime);
        const artists = testFixtures.loadArtist(db);
        const usableAlbum = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() + 1000).toISOString(),
        });
        const usableSong = testFixtures.generateItunesSongLookupResultItem({
          collectionId: usableAlbum.collectionId,
        });
        const oldAlbum = testFixtures
          .generateItunesAlbumLookupResultItem({
            releaseDate: new Date(Date.now() - maxMs - 1000).toISOString(),
          });
        const oldSong = testFixtures.generateItunesSongLookupResultItem(
          {
            collectionId: oldAlbum.collectionId,
            releaseDate: new Date(Date.now() - maxMs - 1000).toISOString(),
          },
        );

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  usableSong,
                  oldSong,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  usableAlbum,
                  oldAlbum,
                ),
              ),
            );
          }
          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${usableAlbum.collectionName} by ${usableAlbum.artistName}`,
            `${usableSong.trackName} by ${usableSong.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 2);
        assertEquals(
          db.sql`select * from releases where id = ${usableAlbum.collectionId} and type = 'collection'`
            .length,
          1,
        );
        assertEquals(
          db.sql`select * from releases where id = ${usableSong.trackId} and type = 'track'`
            .length,
          1,
        );
      });

      it("should exclude compilation releases", async () => {
        const artists = testFixtures.loadArtist(db);
        const usableAlbum = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() + 1000).toISOString(),
        });
        const usableSong = testFixtures.generateItunesSongLookupResultItem({
          collectionId: usableAlbum.collectionId,
        });
        const compilationAlbum = testFixtures
          .generateItunesAlbumLookupResultItem({
            artistName: "Various Artists",
          });
        const compilationSong = testFixtures.generateItunesSongLookupResultItem(
          {
            collectionId: compilationAlbum.collectionId,
            collectionArtistName: "Various artists",
          },
        );

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  usableSong,
                  compilationSong,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  usableAlbum,
                  compilationAlbum,
                ),
              ),
            );
          }
          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${usableAlbum.collectionName} by ${usableAlbum.artistName}`,
            `${usableSong.trackName} by ${usableSong.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 2);
        assertEquals(
          db.sql`select * from releases where id = ${usableAlbum.collectionId} and type = 'collection'`
            .length,
          1,
        );
        assertEquals(
          db.sql`select * from releases where id = ${usableSong.trackId} and type = 'track'`
            .length,
          1,
        );
      });

      it("should exclude dj mixes releases", async () => {
        const artists = testFixtures.loadArtist(db);
        const usableAlbum = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() + 1000).toISOString(),
        });
        const usableSong = testFixtures.generateItunesSongLookupResultItem({
          collectionId: usableAlbum.collectionId,
        });
        const djMixAlbum = testFixtures.generateItunesAlbumLookupResultItem({
          collectionName: "DJ Mix",
        });
        const djMixSong = testFixtures.generateItunesSongLookupResultItem({
          collectionId: djMixAlbum.collectionId,
          collectionCensoredName: "DJ mix",
        });

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  usableSong,
                  djMixSong,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  usableAlbum,
                  djMixAlbum,
                ),
              ),
            );
          }

          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${usableAlbum.collectionName} by ${usableAlbum.artistName}`,
            `${usableSong.trackName} by ${usableSong.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 2);
        assertEquals(
          db.sql`select * from releases where id = ${usableAlbum.collectionId} and type = 'collection'`
            .length,
          1,
        );
        assertEquals(
          db.sql`select * from releases where id = ${usableSong.trackId} and type = 'track'`
            .length,
          1,
        );
      });
    });
  });

  it("should map releases to the correct release before upserting", async () => {
    const artists = testFixtures.loadArtist(db);
    const album = testFixtures.generateItunesAlbumLookupResultItem({
      releaseDate: new Date(Date.now() + 1000).toISOString(),
    });
    const song = testFixtures.generateItunesSongLookupResultItem({
      collectionId: album.collectionId,
    });

    using fetchStub = stub(globalThis, "fetch", (input) => {
      if (input.toString().includes("song")) {
        return Promise.resolve(
          Response.json(
            testFixtures.generateItunesArtistLatestReleasesResult(
              "song",
              song,
            ),
          ),
        );
      }

      if (input.toString().includes("album")) {
        return Promise.resolve(
          Response.json(
            testFixtures.generateItunesArtistLatestReleasesResult(
              "album",
              album,
            ),
          ),
        );
      }

      return Promise.resolve(new Response("Not found", { status: 404 }));
    });
    using dbSqlTagSpy = spy(db, "sql");
    using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

    await runner({ db, abort: new AbortController().signal });

    assertSpyCalls(fetchStub, 2);
    assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
    assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
      "Begin releases sync",
    ]);
    assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
      'Processing releases from "foo" at 1 of 1',
    ]);
    assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
      id: artists.id,
      releases: [
        `${album.collectionName} by ${album.artistName}`,
        `${song.trackName} by ${song.artistName}`,
      ],
    }]);
    assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
      "Upserting releases for artist",
      { id: artists.id },
    ]);
    assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
      "Releases sync ended",
    ]);

    assertSpyCallArg(dbSqlTagSpy, 1, 1, album.collectionId);
    assertSpyCallArg(dbSqlTagSpy, 1, 3, album.collectionName);
    assertSpyCallArg(
      dbSqlTagSpy,
      1,
      5,
      album.artworkUrl100.replace("artwork100", "512x512bb"),
    );
    assertSpyCallArg(dbSqlTagSpy, 1, 7, JSON.stringify([]));
    assertSpyCallArg(dbSqlTagSpy, 1, 8, JSON.stringify(album));

    assertSpyCallArg(dbSqlTagSpy, 4, 1, song.trackId);
    assertSpyCallArg(dbSqlTagSpy, 4, 3, song.trackName);
    assertSpyCallArg(
      dbSqlTagSpy,
      4,
      5,
      song.artworkUrl100.replace("artwork100", "512x512bb"),
    );
    assertSpyCallArg(dbSqlTagSpy, 4, 7, JSON.stringify([]));
    assertSpyCallArg(dbSqlTagSpy, 4, 8, JSON.stringify(song));
  });

  describe("syncReleases()", () => {
    it("should not store any info in db if `syncReleases` throws", async () => {
      const artists = testFixtures.loadArtist(db);
      const album = testFixtures.generateItunesAlbumLookupResultItem({
        releaseDate: new Date(Date.now() + 1000).toISOString(),
      });
      const song = testFixtures.generateItunesSongLookupResultItem({
        collectionId: album.collectionId,
      });

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "song",
                song,
              ),
            ),
          );
        }

        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "album",
                album,
              ),
            ),
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      const originalDbSql = db.sql.bind(db);
      using _ = stub(db, "sql", (strings, ...parameters) => {
        if (strings.some((x) => x.includes("and type = "))) {
          throw new Error("foo");
        }

        return originalDbSql(strings, ...parameters as SQLInputValue[]);
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");
      using syncReleasesJobLogErrorSpy = spy(syncReleasesJobLog, "error");

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
      assertSpyCalls(syncReleasesJobLogErrorSpy, 1);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
        id: artists.id,
        releases: [
          `${album.collectionName} by ${album.artistName}`,
          `${song.trackName} by ${song.artistName}`,
        ],
      }]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
        "Upserting releases for artist",
        { id: artists.id },
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
        "Releases sync ended",
      ]);
      assertSpyCallArg(
        syncReleasesJobLogErrorSpy,
        0,
        0,
        "Something wrong ocurred while upserting releases",
      );
      assertIsError(
        // deno-lint-ignore no-explicit-any
        (syncReleasesJobLogErrorSpy.calls[0]?.args[1] as any).error,
        Error,
        "foo",
      );
      assertEquals(db.sql`select * from releases`.length, 0);
    });

    it("should fallback `releasedAt` from store release", async () => {
      const releasedAt = new Date(0).toISOString();
      const artists = testFixtures.loadArtist(db);
      const storedRelease = testFixtures.loadRelease(db, {
        type: "collection",
        releasedAt: releasedAt,
      });
      const album = testFixtures.generateItunesAlbumLookupResultItem({
        releaseDate: "",
        collectionId: storedRelease.id,
      });

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "song",
              ),
            ),
          );
        }

        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "album",
                album,
              ),
            ),
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
        id: artists.id,
        releases: [
          `${album.collectionName} by ${album.artistName}`,
        ],
      }]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
        "Upserting releases for artist",
        { id: artists.id },
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
        "Releases sync ended",
      ]);
      assertEquals(
        db.sql`select * from releases where id = ${album.collectionId}`[0]?.[
          "releasedAt"
        ],
        releasedAt,
      );
    });

    it("should use current time for releasedAt if no store release", async () => {
      const artists = testFixtures.loadArtist(db);
      const album = testFixtures.generateItunesAlbumLookupResultItem({
        releaseDate: "",
      });

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "song",
              ),
            ),
          );
        }

        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "album",
                album,
              ),
            ),
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");
      using _ = new FakeTime(0);

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
        id: artists.id,
        releases: [
          `${album.collectionName} by ${album.artistName}`,
        ],
      }]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
        "Upserting releases for artist",
        { id: artists.id },
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
        "Releases sync ended",
      ]);
      assertEquals(
        db.sql`select * from releases where id = ${album.collectionId}`[0]?.[
          "releasedAt"
        ],
        new Date().toISOString(),
      );
    });

    it("should use stored feedAt as feedAt if it exists", async () => {
      const releasedAt = new Date(Date.now() + 100_000).toISOString();
      const feedAt = new Date(Date.now() + 200_000).toISOString();
      const artists = testFixtures.loadArtist(db);
      const albumStored = testFixtures.loadRelease(db, {
        type: "collection",
        feedAt,
      });
      const album = testFixtures.generateItunesAlbumLookupResultItem({
        releaseDate: releasedAt,
        collectionId: albumStored.id,
      });

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "song",
              ),
            ),
          );
        }

        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "album",
                album,
              ),
            ),
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
        id: artists.id,
        releases: [
          `${album.collectionName} by ${album.artistName}`,
        ],
      }]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
        "Upserting releases for artist",
        { id: artists.id },
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
        "Releases sync ended",
      ]);
      assertEquals(
        db.sql`select * from releases where id = ${album.collectionId}`[0]?.[
          "feedAt"
        ],
        feedAt,
      );
    });

    it("should use releasedAt as feedAt if it is a date in the future", async () => {
      const releasedAt = new Date(Date.now() + 100_000).toISOString();
      const artists = testFixtures.loadArtist(db);
      const album = testFixtures.generateItunesAlbumLookupResultItem({
        releaseDate: releasedAt,
      });

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "song",
              ),
            ),
          );
        }

        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "album",
                album,
              ),
            ),
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
        id: artists.id,
        releases: [
          `${album.collectionName} by ${album.artistName}`,
        ],
      }]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
        "Upserting releases for artist",
        { id: artists.id },
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
        "Releases sync ended",
      ]);
      assertEquals(
        db.sql`select * from releases where id = ${album.collectionId}`[0]?.[
          "feedAt"
        ],
        releasedAt,
      );
    });

    it("should not use releasedAt as feedAt if it is not a date in the future", async () => {
      const now = Date.now();
      const releasedAt = new Date(now - 100_000).toISOString();
      const artists = testFixtures.loadArtist(db);
      const album = testFixtures.generateItunesAlbumLookupResultItem({
        releaseDate: releasedAt,
      });

      using fetchStub = stub(globalThis, "fetch", (input) => {
        if (input.toString().includes("song")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "song",
              ),
            ),
          );
        }

        if (input.toString().includes("album")) {
          return Promise.resolve(
            Response.json(
              testFixtures.generateItunesArtistLatestReleasesResult(
                "album",
                album,
              ),
            ),
          );
        }

        return Promise.resolve(new Response("Not found", { status: 404 }));
      });
      using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");
      using _ = new FakeTime(now);

      await runner({ db, abort: new AbortController().signal });

      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, ["Begin releases sync"]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
        id: artists.id,
        releases: [
          `${album.collectionName} by ${album.artistName}`,
        ],
      }]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
        "Upserting releases for artist",
        { id: artists.id },
      ]);
      assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
        "Releases sync ended",
      ]);
      assertEquals(
        db.sql`select * from releases where id = ${album.collectionId}`[0]?.[
          "feedAt"
        ],
        new Date().toISOString(),
      );
    });

    describe("song", () => {
      it("should ignore song if not streamable", async () => {
        const artists = testFixtures.loadArtist(db);
        const album = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() + 1000).toISOString(),
        });
        const song = testFixtures.generateItunesSongLookupResultItem({
          collectionId: album.collectionId,
          isStreamable: false,
        });

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  song,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  album,
                ),
              ),
            );
          }

          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 6);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${album.collectionName} by ${album.artistName}`,
            `${song.trackName} by ${song.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Release is not streamable, ignoring",
          { id: song.trackId },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 5, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 1);
        assertEquals(
          db.sql`select * from releases where id = ${album.collectionId}`
            .length,
          1,
        );
      });

      it("should ignore song if no album exists", async () => {
        const artists = testFixtures.loadArtist(db);
        const song = testFixtures.generateItunesSongLookupResultItem();

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  song,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                ),
              ),
            );
          }

          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 6);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${song.trackName} by ${song.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Track does not have a previous saved album, ignoring",
          { id: song.trackId },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 5, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 0);
      });

      it("should ignore song if album was already released", async () => {
        const artists = testFixtures.loadArtist(db);
        const album = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() - 20_000).toISOString(),
        });
        const song = testFixtures.generateItunesSongLookupResultItem({
          collectionId: album.collectionId,
        });

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  song,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  album,
                ),
              ),
            );
          }

          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 6);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${album.collectionName} by ${album.artistName}`,
            `${song.trackName} by ${song.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "The album that contains the current track release, was already released, ignoring",
          { id: song.trackId, albumId: album.collectionId },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 5, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 1);
        assertEquals(
          db.sql`select * from releases where id = ${album.collectionId}`
            .length,
          1,
        );
      });

      it("should sync releases", async () => {
        const artists = testFixtures.loadArtist(db);
        const album = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() + 1000).toISOString(),
        });
        const song = testFixtures.generateItunesSongLookupResultItem({
          collectionId: album.collectionId,
        });

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  song,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  album,
                ),
              ),
            );
          }

          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${album.collectionName} by ${album.artistName}`,
            `${song.trackName} by ${song.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 2);
        assertEquals(
          db.sql`select * from releases where id = ${album.collectionId} and type = 'collection'`
            .length,
          1,
        );
        assertEquals(
          db.sql`select * from releases where id = ${song.trackId} and type = 'track'`
            .length,
          1,
        );
      });

      it("should upsert synced releases", async () => {
        const artists = testFixtures.loadArtist(db);
        const storedSong = testFixtures.loadRelease(db, {
          type: "track",
          name: "foo",
        });
        const album = testFixtures.generateItunesAlbumLookupResultItem({
          releaseDate: new Date(Date.now() + 1000).toISOString(),
        });
        const song = testFixtures.generateItunesSongLookupResultItem({
          collectionId: album.collectionId,
          trackId: storedSong.id,
          trackName: "bar",
        });

        using fetchStub = stub(globalThis, "fetch", (input) => {
          if (input.toString().includes("song")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "song",
                  song,
                ),
              ),
            );
          }

          if (input.toString().includes("album")) {
            return Promise.resolve(
              Response.json(
                testFixtures.generateItunesArtistLatestReleasesResult(
                  "album",
                  album,
                ),
              ),
            );
          }

          return Promise.resolve(new Response("Not found", { status: 404 }));
        });
        using syncReleasesJobLogInfoSpy = spy(syncReleasesJobLog, "info");

        await runner({ db, abort: new AbortController().signal });

        assertSpyCalls(fetchStub, 2);
        assertSpyCalls(syncReleasesJobLogInfoSpy, 5);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 0, [
          "Begin releases sync",
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 1, [
          'Processing releases from "foo" at 1 of 1',
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 2, ["Usable releases", {
          id: artists.id,
          releases: [
            `${album.collectionName} by ${album.artistName}`,
            `${song.trackName} by ${song.artistName}`,
          ],
        }]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 3, [
          "Upserting releases for artist",
          { id: artists.id },
        ]);
        assertSpyCallArgs(syncReleasesJobLogInfoSpy, 4, [
          "Releases sync ended",
        ]);
        assertEquals(db.sql`select * from releases`.length, 2);
        assertEquals(
          db.sql`select * from releases where id = ${song.trackId} and type = 'track'`[
            0
          ]?.["name"],
          "bar",
        );
      });
    });
  });
});
