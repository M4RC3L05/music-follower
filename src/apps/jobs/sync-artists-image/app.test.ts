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
import runner from "#src/apps/jobs/sync-artists-image/app.ts";
import {
  assertSpyCallArg,
  assertSpyCallArgs,
  assertSpyCalls,
  spy,
  stub,
} from "@std/testing/mock";
import { makeLogger } from "#src/common/logger/mod.ts";
import { FakeTime } from "@std/testing/time";

const log = makeLogger("sync-artists-image-job");
let db: CustomDatabase;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);
});

beforeEach(() => {
  db.exec("delete from artists");
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

  it("should continue if `getArtistById` fails", async () => {
    testFixtures.loadArtist(db);

    using fetchSpy = stub(globalThis, "fetch", (input) => {
      if (input.toString().includes("https://itunes.apple.com/lookup")) {
        return Promise.reject(new Error("foo"));
      }

      return Promise.resolve(new Response(null, { status: 204 }));
    });
    using logSpy = spy(log, "error");
    using sqlSpy = spy(db, "sql");

    await runner({ db, abort: new AbortController().signal });

    assertSpyCalls(fetchSpy, 1);
    assertSpyCalls(logSpy, 1);
    assertSpyCalls(sqlSpy, 1);
    assertSpyCallArgs(sqlSpy, 0, [["PRAGMA wal_checkpoint(TRUNCATE);"]]);
    assertSpyCallArg(
      logSpy,
      0,
      0,
      "Something went wrong fetching artist image",
    );
    assertEquals(
      (logSpy.calls[0]?.args[1] as { error: Error }).error.message,
      "foo",
    );
  });

  it("should continue if `getArtistById` returns empty", async () => {
    const artist = testFixtures.loadArtist(db);

    using fetchSpy = stub(globalThis, "fetch", (input) => {
      if (input.toString().includes("https://itunes.apple.com/lookup")) {
        return Promise.resolve(Response.json({ results: [] }));
      }

      return Promise.resolve(new Response(null, { status: 204 }));
    });
    using logSpy = spy(log, "error");
    using sqlSpy = spy(db, "sql");

    await runner({ db, abort: new AbortController().signal });

    assertSpyCalls(fetchSpy, 1);
    assertSpyCalls(logSpy, 1);
    assertSpyCalls(sqlSpy, 1);
    assertSpyCallArgs(sqlSpy, 0, [["PRAGMA wal_checkpoint(TRUNCATE);"]]);
    assertSpyCallArg(
      logSpy,
      0,
      0,
      "Something went wrong fetching artist image",
    );
    assertEquals(
      (logSpy.calls[0]?.args[1] as { error: { message: string } }).error
        .message,
      `No remote artist found with id ${artist.id}`,
    );
  });

  it("should continue if `getArtistImage` fails", async () => {
    testFixtures.loadArtist(db);

    using fetchSpy = stub(globalThis, "fetch", (input) => {
      if (String(input).includes("https://itunes.apple.com/lookup")) {
        return Promise.resolve(
          Response.json({
            results: [testFixtures.generateItunesArtistsSearchResult()],
          }),
        );
      }

      return Promise.reject(new Error("foobar"));
    });
    using logSpy = spy(log, "error");
    using sqlSpy = spy(db, "sql");

    await runner({ db, abort: new AbortController().signal });

    assertSpyCalls(fetchSpy, 2);
    assertSpyCalls(logSpy, 1);
    assertSpyCalls(sqlSpy, 1);
    assertSpyCallArgs(sqlSpy, 0, [["PRAGMA wal_checkpoint(TRUNCATE);"]]);
    assertSpyCallArg(
      logSpy,
      0,
      0,
      "Something went wrong fetching artist image",
    );
    assertEquals(
      (logSpy.calls[0]?.args[1] as { error: Error }).error.message,
      "foobar",
    );
  });

  it("should continue if sql update fails", async () => {
    const artist = testFixtures.loadArtist(db);

    using fetchSpy = stub(globalThis, "fetch", (input) => {
      if (String(input).includes("https://itunes.apple.com/lookup")) {
        return Promise.resolve(
          Response.json({
            results: [testFixtures.generateItunesArtistsSearchResult()],
          }),
        );
      }

      return Promise.resolve(
        new Response('<meta property="og:image" content="foo.com"'),
      );
    });
    using logSpy = spy(log, "error");
    using sqlSpy = stub(db, "sql", () => {
      throw new Error("foo");
    });

    try {
      await runner({ db, abort: new AbortController().signal });
    } catch (error) {
      assertIsError(error);
      assertEquals(error.message, "foo");
    }

    assertSpyCalls(fetchSpy, 2);
    assertSpyCalls(logSpy, 1);
    assertSpyCalls(sqlSpy, 2);
    assertSpyCallArg(
      logSpy,
      0,
      0,
      "Something wrong ocurred while updating artist image",
    );
    assertEquals(
      (logSpy.calls[0]?.args[1] as { error: Error }).error.message,
      "foo",
    );
    assertSpyCallArgs(sqlSpy, 0, [
      [
        "update artists set image = ",
        " where id = ",
        "",
      ],
      "256x256.com",
      artist.id,
    ]);
    assertSpyCallArgs(sqlSpy, 1, [["PRAGMA wal_checkpoint(TRUNCATE);"]]);
  });

  it("should complete if sql update completes", async () => {
    const artist = testFixtures.loadArtist(db, { image: "foo.com" });

    using fetchSpy = stub(globalThis, "fetch", (input) => {
      if (String(input).includes("https://itunes.apple.com/lookup")) {
        return Promise.resolve(
          Response.json({
            results: [testFixtures.generateItunesArtistsSearchResult()],
          }),
        );
      }

      return Promise.resolve(
        new Response('<meta property="og:image" content="foo.com"'),
      );
    });
    using logSpy = spy(log, "error");
    using sqlSpy = spy(db, "sql");

    await runner({ db, abort: new AbortController().signal });

    assertSpyCalls(fetchSpy, 2);
    assertSpyCalls(logSpy, 0);
    assertSpyCalls(sqlSpy, 2);
    assertSpyCallArgs(sqlSpy, 0, [
      [
        "update artists set image = ",
        " where id = ",
        "",
      ],
      "256x256.com",
      artist.id,
    ]);
    assertSpyCallArgs(sqlSpy, 1, [["PRAGMA wal_checkpoint(TRUNCATE);"]]);
    assertEquals(
      db.sql`select image from artists where id = ${artist.id}`[0]!.image,
      "256x256.com",
    );
  });

  it("should handle multiple artists", async () => {
    const artistOne = testFixtures.loadArtist(db, {
      id: 1,
      name: "biz",
      image: "biz.com",
    });
    const artistTwo = testFixtures.loadArtist(db, {
      id: 2,
      name: "foo",
      image: "foo.com",
    });
    const artistThree = testFixtures.loadArtist(db, {
      id: 3,
      name: "bar",
      image: "bar.com",
    });
    const artistFour = testFixtures.loadArtist(db, {
      id: 4,
      name: "buz",
      image: "buz.com",
    });
    const err = new Error("foo");

    using _ = stub(globalThis, "fetch", (input) => {
      if (String(input).includes("https://itunes.apple.com/lookup?id=")) {
        const id = Number(new URL(String(input)).searchParams.get("id")!);

        if (id === 1 || id === 2) {
          return Promise.resolve(
            Response.json({
              results: [{
                artistLinkUrl: `https://apple.music.com/artists/${id}`,
              }],
            }),
          );
        }

        if (id === 3) {
          return Promise.resolve(
            Response.json({
              results: [],
            }),
          );
        }

        return Promise.reject(err);
      }

      const id = Number(
        String(input).slice(String(input).lastIndexOf("/") + 1),
      );

      if (id === 1) {
        return Promise.resolve(
          new Response('<meta property="og:image" content="foo.com"'),
        );
      }

      return Promise.reject(err);
    });
    using timer = new FakeTime(0);
    using logErrSpy = spy(log, "error");
    using logInfoSpy = spy(log, "info");
    using sqlSpy = spy(db, "sql");

    const r = runner({ db, abort: new AbortController().signal });
    await timer.runAllAsync();
    await r;

    assertSpyCalls(logErrSpy, 3);
    assertSpyCallArgs(logErrSpy, 0, [
      "Something went wrong fetching artist image",
      { error: err },
    ]);
    assertSpyCallArg(
      logErrSpy,
      1,
      0,
      "Something went wrong fetching artist image",
    );
    assertEquals(
      (logErrSpy.calls[1]?.args[1] as { error: Error }).error.message,
      "No remote artist found with id 3",
    );
    assertSpyCallArgs(logErrSpy, 2, [
      "Something went wrong fetching artist image",
      { error: err },
    ]);

    assertSpyCalls(logInfoSpy, 11);
    assertSpyCallArgs(logInfoSpy, 0, ["Begin artist image sync"]);
    assertSpyCallArgs(logInfoSpy, 1, ['Sync image from "biz" at 1 of 4']);
    assertSpyCallArgs(logInfoSpy, 2, ["Updating artist image", {
      id: 1,
    }]);
    assertSpyCallArgs(logInfoSpy, 3, ["Artist image updated", {
      id: 1,
    }]);
    assertSpyCallArgs(logInfoSpy, 4, [
      "Waiting 5 seconds before processing next artist",
    ]);
    assertSpyCallArgs(logInfoSpy, 5, ['Sync image from "foo" at 2 of 4']);
    assertSpyCallArgs(logInfoSpy, 6, [
      "Waiting 5 seconds before processing next artist",
    ]);
    assertSpyCallArgs(logInfoSpy, 7, ['Sync image from "bar" at 3 of 4']);
    assertSpyCallArgs(logInfoSpy, 8, [
      "Waiting 5 seconds before processing next artist",
    ]);
    assertSpyCallArgs(logInfoSpy, 9, ['Sync image from "buz" at 4 of 4']);
    assertSpyCallArgs(logInfoSpy, 10, ["Artist image sync ended"]);

    assertSpyCalls(sqlSpy, 2);
    assertSpyCallArgs(sqlSpy, 0, [
      [
        "update artists set image = ",
        " where id = ",
        "",
      ],
      "256x256.com",
      1,
    ]);
    assertSpyCallArgs(sqlSpy, 1, [["PRAGMA wal_checkpoint(TRUNCATE);"]]);

    assertEquals(
      db.sql`select image from artists where id = ${artistOne.id}`[0]!.image,
      "256x256.com",
    );
    assertEquals(
      db.sql`select image from artists where id = ${artistTwo.id}`[0]!.image,
      "foo.com",
    );
    assertEquals(
      db.sql`select image from artists where id = ${artistThree.id}`[0]!.image,
      "bar.com",
    );
    assertEquals(
      db.sql`select image from artists where id = ${artistFour.id}`[0]!.image,
      "buz.com",
    );
  });
});
