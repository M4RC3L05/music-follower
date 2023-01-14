/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import timers from "node:timers/promises";
import { afterEach, before, beforeEach, describe, it } from "node:test";

import sinon from "sinon";

import { run } from "#src/apps/jobs/sync-releases/task.js";
import * as database from "#src/database/index.js";
import { artistFixtures, itunesFixtures, nockFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks, nockHooks } from "#src/utils/tests/hooks/index.js";

describe("task", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  describe("run()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should do no work if no artists exist", async () => {
      await run(new AbortController().signal);

      assert.strict.equal(database.releases.queries.getLatests().length, 0);
    });

    it("should do no work if getting the new releases fails", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(500, {}, 1);
      nockFixtures.getLatestsArtistMusicReleases(500, {}, 1);
      artistFixtures.loadArtist();

      sinon.stub(timers, "setTimeout").resolves();

      await run(new AbortController().signal);

      assert.strict.equal(database.releases.queries.getLatests().length, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should do no work if no releases were fetched", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(200, { results: [] }, 1);
      nockFixtures.getLatestsArtistMusicReleases(200, { results: [] }, 1);
      artistFixtures.loadArtist();

      sinon.stub(timers, "setTimeout").resolves();

      await run(new AbortController().signal);

      assert.strict.equal(database.releases.queries.getLatests().length, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should ignore releases based on the `max-release-time` config", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(
        200,
        {
          results: [
            {},
            itunesFixtures.loadItunesLookupAlbum({
              releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
            }),
            itunesFixtures.loadItunesLookupAlbum({
              releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 366).toISOString(),
            }),
            itunesFixtures.loadItunesLookupAlbum({
              releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 364).toISOString(),
            }),
          ],
        },
        1,
      );
      artistFixtures.loadArtist();

      sinon.stub(timers, "setTimeout").resolves();

      await run(new AbortController().signal);

      assert.strict.equal(database.releases.queries.getLatests().length, 1);

      sinon.restore();
      sinon.reset();
    });

    it("should ignore release if it is part of a compilation", async () => {
      nockFixtures.getLatestsArtistMusicReleases(
        200,
        {
          results: [
            {},
            itunesFixtures.loadItunesLookupSong({
              releaseDate: new Date().toISOString(),
              collectionArtistName: "Various Artists",
            }),
          ],
        },
        1,
      );
      artistFixtures.loadArtist();

      sinon.stub(timers, "setTimeout").resolves();

      await run(new AbortController().signal);

      assert.strict.equal(database.releases.queries.getLatests().length, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should save releases", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(
        200,
        {
          results: [
            {},
            itunesFixtures.loadItunesLookupAlbum({ collectionId: 2, releaseDate: new Date().toISOString() }),
          ],
        },
        1,
      );
      nockFixtures.getLatestsArtistMusicReleases(
        200,
        {
          results: [
            {},
            itunesFixtures.loadItunesLookupSong({ trackId: 1, collectionId: 3, releaseDate: new Date().toISOString() }),
          ],
        },
        1,
      );
      artistFixtures.loadArtist();

      sinon.stub(timers, "setTimeout").resolves();

      await run(new AbortController().signal);

      assert.strict.equal(database.releases.queries.getLatests().length, 1);

      sinon.restore();
      sinon.reset();
    });
  });
});
