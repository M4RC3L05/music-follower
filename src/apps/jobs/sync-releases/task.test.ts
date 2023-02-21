import timers from "node:timers/promises";

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import * as database from "#src/database/mod.js";
import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { run } from "#src/apps/jobs/sync-releases/task.js";

describe("task", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  describe("run()", () => {
    beforeEach(() => {
      hooks.database.cleanup();
    });

    afterEach(() => {
      hooks.nock.checkMocks();
    });

    it("should do no work if no artists exist", async () => {
      await run(new AbortController().signal);

      expect(database.releases.queries.getLatests()).toHaveLength(0);
    });

    it("should do no work if getting the new releases fails", async () => {
      fixtures.nock.getLatestsArtistAlbumReleases(500, {}, 1);
      fixtures.nock.getLatestsArtistMusicReleases(500, {}, 1);
      fixtures.artists.load();

      vi.spyOn(timers, "setTimeout").mockResolvedValue(undefined);

      await run(new AbortController().signal);

      expect(database.releases.queries.getLatests()).toHaveLength(0);
    });

    it("should do no work if no releases were fetched", async () => {
      fixtures.nock.getLatestsArtistAlbumReleases(200, { results: [] }, 1);
      fixtures.nock.getLatestsArtistMusicReleases(200, { results: [] }, 1);
      fixtures.artists.load();

      vi.spyOn(timers, "setTimeout").mockResolvedValue(undefined);

      await run(new AbortController().signal);

      expect(database.releases.queries.getLatests()).toHaveLength(0);
    });

    it("should ignore releases based on the `max-release-time` config", async () => {
      fixtures.nock.getLatestsArtistAlbumReleases(
        200,
        {
          results: [
            {},
            fixtures.itunes.loadLookupAlbum({
              releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
            }),
            fixtures.itunes.loadLookupAlbum({
              releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 366).toISOString(),
            }),
            fixtures.itunes.loadLookupAlbum({
              releaseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 364).toISOString(),
            }),
          ],
        },
        1,
      );
      fixtures.artists.load();

      vi.spyOn(timers, "setTimeout").mockResolvedValue(undefined);

      await run(new AbortController().signal);

      expect(database.releases.queries.getLatests()).toHaveLength(1);
    });

    it("should ignore release if it is part of a compilation", async () => {
      fixtures.nock.getLatestsArtistMusicReleases(
        200,
        {
          results: [
            {},
            fixtures.itunes.loadLookupSong({
              releaseDate: new Date().toISOString(),
              collectionArtistName: "Various Artists",
            }),
          ],
        },
        1,
      );
      fixtures.artists.load();

      vi.spyOn(timers, "setTimeout").mockResolvedValue(undefined);

      await run(new AbortController().signal);

      expect(database.releases.queries.getLatests()).toHaveLength(0);
    });

    it("should save releases", async () => {
      fixtures.nock.getLatestsArtistAlbumReleases(
        200,
        {
          results: [{}, fixtures.itunes.loadLookupAlbum({ collectionId: 2, releaseDate: new Date().toISOString() })],
        },
        1,
      );
      fixtures.nock.getLatestsArtistMusicReleases(
        200,
        {
          results: [
            {},
            fixtures.itunes.loadLookupSong({
              trackId: 1,
              collectionId: 3,
              releaseDate: new Date().toISOString(),
            }),
          ],
        },
        1,
      );
      fixtures.artists.load();

      vi.spyOn(timers, "setTimeout").mockResolvedValue(undefined);

      await run(new AbortController().signal);

      expect(database.releases.queries.getLatests()).toHaveLength(1);
    });
  });
});
