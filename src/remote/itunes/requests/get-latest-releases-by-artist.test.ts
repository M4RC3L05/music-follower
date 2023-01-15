/* eslint-disable @typescript-eslint/no-implicit-any-catch */
import { afterEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { getLatestReleasesByArtist } from "./get-latest-releases-by-artist.js";

describe("getLatestReleasesByArtist()", () => {
  describe("song", () => {
    afterEach(() => {
      hooks.nock.checkMocks();
    });

    it("should throw if request fails", async () => {
      fixtures.nock.getLatestsArtistMusicReleases(500, {}, 1);

      try {
        await getLatestReleasesByArtist(1, "song");

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      fixtures.nock.getLatestsArtistMusicReleases(
        200,
        {
          results: [{}, fixtures.itunes.loadLookupSong({ trackId: 1 })],
        },
        1,
      );

      const data = await getLatestReleasesByArtist(1, "song");
      assert.strict.equal(data.results.at(0)?.trackId, 1);
    });
  });

  describe("album", () => {
    afterEach(() => {
      hooks.nock.checkMocks();
    });

    it("should throw if request fails", async () => {
      fixtures.nock.getLatestsArtistAlbumReleases(500, {}, 1);

      try {
        await getLatestReleasesByArtist(1, "album");

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      fixtures.nock.getLatestsArtistAlbumReleases(
        200,
        {
          results: [{}, fixtures.itunes.loadLookupAlbum({ collectionId: 1 })],
        },
        1,
      );

      const data = await getLatestReleasesByArtist(1, "album");
      assert.strict.equal(data.results.at(0)!.collectionId, 1);
    });
  });
});
