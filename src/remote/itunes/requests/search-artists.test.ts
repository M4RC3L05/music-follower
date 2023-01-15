/* eslint-disable @typescript-eslint/no-implicit-any-catch */
import { afterEach, describe, it } from "node:test";
import assert from "node:assert";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { searchArtists } from "./search-artists.js";

describe("searchArtists()", () => {
  afterEach(() => {
    hooks.nock.checkMocks();
  });

  it("should throw if request fails", async () => {
    fixtures.nock.searchArtists(500, {}, "foo");

    try {
      await searchArtists("foo");

      assert.strict.fail("not throw");
    } catch (error: any) {
      assert.strict.equal(error.message, "An error ocurred while searching for artists");
      assert.strict.equal(error.cause, 500);
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
    assert.strict.equal(data.results.at(0)?.artistId, 1);
  });
});
