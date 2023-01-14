/* eslint-disable @typescript-eslint/no-implicit-any-catch */
import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import { searchArtists } from "./search-artists.js";
import { itunesFixtures, nockFixtures } from "#src/utils/tests/fixtures/index.js";
import { nockHooks } from "#src/utils/tests/hooks/index.js";

describe("searchArtists()", () => {
  afterEach(() => {
    nockHooks.checkMocks();
  });

  it("should throw if request fails", async () => {
    nockFixtures.searchArtists(500, {}, "foo");

    try {
      await searchArtists("foo");

      assert.strict.fail("not throw");
    } catch (error: any) {
      assert.strict.equal(error.message, "An error ocurred while searching for artists");
      assert.strict.equal(error.cause, 500);
    }
  });

  it("should return the latest artist track releases", async () => {
    nockFixtures.searchArtists(
      200,
      {
        results: [itunesFixtures.loadItunesSearchArtist({ artistId: 1 })],
      },
      "foo",
    );

    const data = await searchArtists("foo");
    assert.strict.equal(data.results.at(0)?.artistId, 1);
  });
});
