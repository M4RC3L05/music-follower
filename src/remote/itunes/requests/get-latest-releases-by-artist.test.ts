import { afterEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { getLatestReleasesByArtist } from "./get-latest-releases-by-artist.js";

describe("getLatestReleasesByArtist()", () => {
  it("should abort request", async () => {
    try {
      const abortController = new AbortController();
      const promise = getLatestReleasesByArtist(1, "song", abortController.signal);
      abortController.abort();

      await promise;

      expect.fail("not throw");
    } catch (error: unknown) {
      expect((error as any).message).toBe("The operation was aborted.");
      expect((error as any).cause).toBe(undefined);
    }
  });

  describe("song", () => {
    afterEach(() => {
      hooks.nock.checkMocks();
    });

    it("should throw if request fails", async () => {
      fixtures.nock.getLatestsArtistMusicReleases(500, {}, 1);

      try {
        await getLatestReleasesByArtist(1, "song");

        expect.fail("not throw");
      } catch (error: unknown) {
        expect((error as any).message).toBe("Error requesting lookup artists releases");
        expect((error as any).cause).toBe(500);
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
      expect(data.results.at(0)?.trackId).toBe(1);
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

        expect.fail("not throw");
      } catch (error: unknown) {
        expect((error as any).message).toBe("Error requesting lookup artists releases");
        expect((error as any).cause).toBe(500);
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
      expect(data.results.at(0)!.collectionId).toBe(1);
    });
  });
});
