import { afterEach, describe, it } from "node:test";
import assert from "node:assert";

import config from "config";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { getArtistImage } from "./get-artist-image.js";

describe("getArtistImage()", () => {
  afterEach(() => {
    hooks.nock.checkMocks();
  });

  it("should throw if fetching profile page fails", async () => {
    fixtures.nock.getAppleMusicArtistPage(
      500,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("https://foo.com/foo.png"),
    );

    try {
      await getArtistImage("https://foo.com");

      assert.strict.fail("no throw");
      // eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
    } catch (error: any) {
      assert.strict.equal(error.message, "An error ocurred while searching for artist image");
    }
  });

  it("should get artist image from apple music profile url", async () => {
    fixtures.nock.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("https://foo.com/foo.png"),
    );

    assert.strict.deepEqual(await getArtistImage("https://foo.com"), "https://foo.com/256x256.png");
  });

  it("should use placeholder if it cannot parse artist image url", async () => {
    fixtures.nock.getAppleMusicArtistPage(200, "https://foo.com", fixtures.appleMusic.loadArtistPage(""));
    fixtures.nock.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("apple-music-foo"),
    );

    assert.strict.equal(await getArtistImage("https://foo.com"), config.get("media.placeholderImage"));
    assert.strict.equal(await getArtistImage("https://foo.com"), config.get("media.placeholderImage"));
  });
});
