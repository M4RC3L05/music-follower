import { afterEach, describe, expect, it } from "vitest";

import * as fixtures from "#src/common/utils/test-utils/fixtures/mod.js";
import * as hooks from "#src/common/utils/test-utils/hooks/mod.js";
import { searchArtists } from "./search-artists.js";

describe("searchArtists()", () => {
  afterEach(() => {
    hooks.nock.checkMocks();
  });

  it("should throw if request fails", async () => {
    fixtures.nock.searchArtists(500, {}, "foo");

    try {
      await searchArtists("foo");

      expect.fail("not throw");
    } catch (error: unknown) {
      expect((error as any).message).toBe("An error ocurred while searching for artists");
      expect((error as any).cause).toBe(500);
    }
  });

  it("should return the latest artist track releases", async () => {
    fixtures.nock.searchArtists(
      200,
      {
        results: [fixtures.itunes.loadSearchArtist({ artistId: 1 })],
      },
      "foo",
    );

    const data = await searchArtists("foo");
    expect(data.results.at(0)?.artistId).toBe(1);
  });
});
