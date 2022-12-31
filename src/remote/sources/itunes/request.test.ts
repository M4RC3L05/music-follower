/* eslint-disable @typescript-eslint/no-implicit-any-catch */
import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import {
  getLatestsArtistAlbumReleases,
  getLatestsArtistMusicReleases,
  searchArtists,
} from "#src/remote/sources/itunes/requests.js";
import { itunesFixtures, nockFixtures } from "#src/utils/tests/fixtures/index.js";
import { nockHooks } from "#src/utils/tests/hooks/index.js";

describe("itunes", () => {
  describe("getLatestsArtistMusicReleases()", () => {
    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should throw if request fails", async () => {
      nockFixtures.getLatestsArtistMusicReleases(500, {});

      try {
        await getLatestsArtistMusicReleases(1);

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists music releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      nockFixtures.getLatestsArtistMusicReleases(200, {
        results: [{}, itunesFixtures.loadItunesLookupSong({ trackId: 1 })],
      });

      const data = await getLatestsArtistMusicReleases(1);
      assert.strict.equal(data.results.at(0)?.trackId, 1);
    });
  });

  describe("getLatestsArtistAlbumReleases()", () => {
    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should throw if request fails", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(500, {});

      try {
        await getLatestsArtistAlbumReleases(1);

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists album releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(200, {
        results: [{}, itunesFixtures.loadItunesLookupAlbum({ collectionId: 1 })],
      });

      const data = await getLatestsArtistAlbumReleases(1);
      assert.strict.equal(data.results.at(0)?.collectionId, 1);
    });
  });

  describe("getLatestsArtistAlbumReleases()", () => {
    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should throw if request fails", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(500, {});

      try {
        await getLatestsArtistAlbumReleases(1);

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "Error requesting lookup artists album releases");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      nockFixtures.getLatestsArtistAlbumReleases(200, {
        results: [{}, itunesFixtures.loadItunesLookupAlbum({ collectionId: 1 })],
      });

      const data = await getLatestsArtistAlbumReleases(1);
      assert.strict.equal(data.results.at(0)?.collectionId, 1);
    });
  });

  describe("searchArtists()", () => {
    afterEach(() => {
      nockHooks.checkMocks();
    });

    it("should throw if request fails", async () => {
      nockFixtures.searchArtists(500, {});

      try {
        await searchArtists("foo");

        assert.strict.fail("not throw");
      } catch (error: any) {
        assert.strict.equal(error.message, "An error ocurred while searching for artists");
        assert.strict.equal(error.cause, 500);
      }
    });

    it("should return the latest artist track releases", async () => {
      nockFixtures.searchArtists(200, {
        results: [itunesFixtures.loadItunesSearchArtist({ artistId: 1 })],
      });

      const data = await searchArtists("foo");
      assert.strict.equal(data.results.at(0)?.artistId, 1);
    });
  });
});
