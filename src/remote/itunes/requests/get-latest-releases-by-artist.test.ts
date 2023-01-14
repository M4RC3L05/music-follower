/* eslint-disable @typescript-eslint/no-implicit-any-catch */
import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import { itunesFixtures, nockFixtures } from "#src/utils/tests/fixtures/index.js";
import { nockHooks } from "#src/utils/tests/hooks/index.js";
import { getLatestReleasesByArtist } from "./get-latest-releases-by-artist.js";

describe("getLatestReleasesByArtist()", () => {
  describe("song", () => {
    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should throw if request fails", async () => {
      nockFixtures.getLatestsArtistMusicReleases(500, {}, 1);

      try {
        await getLatestReleasesByArtist(1, "song");

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      nockFixtures.getLatestsArtistMusicReleases(
        200,
        {
          results: [{}, itunesFixtures.loadItunesLookupSong({ trackId: 1 })],
        },
        1,
      );

      const data = await getLatestReleasesByArtist(1, "song");
      assert.strict.equal(data.results.at(0)?.trackId, 1);
    });
  });

  describe("album", () => {
    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should throw if request fails", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(500, {}, 1);

      try {
        await getLatestReleasesByArtist(1, "album");

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(
        200,
        {
          results: [{}, itunesFixtures.loadItunesLookupAlbum({ collectionId: 1 })],
        },
        1,
      );

      const data = await getLatestReleasesByArtist(1, "album");
      assert.strict.equal(data.results.at(0)!.collectionId, 1);
    });
  });
});
