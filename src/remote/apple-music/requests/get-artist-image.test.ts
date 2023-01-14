import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import config from "config";

import { getArtistImage } from "./get-artist-image.js";
import { appleMusicFixture, nockFixtures } from "#src/utils/tests/fixtures/index.js";
import { nockHooks } from "#src/utils/tests/hooks/index.js";

describe("getArtistImage()", () => {
  afterEach(() => {
    nockHooks.checkMocks();
  });

  it("should throw if fetching profile page fails", async () => {
    nockFixtures.getAppleMusicArtistPage(
      500,
      "https://foo.com",
      appleMusicFixture.loadArtistPage("https://foo.com/foo.png"),
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
    nockFixtures.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      appleMusicFixture.loadArtistPage("https://foo.com/foo.png"),
    );

    assert.strict.deepEqual(await getArtistImage("https://foo.com"), "https://foo.com/256x256.png");
  });

  it("should use placeholder if it cannot parse artist image url", async () => {
    nockFixtures.getAppleMusicArtistPage(200, "https://foo.com", appleMusicFixture.loadArtistPage(""));
    nockFixtures.getAppleMusicArtistPage(200, "https://foo.com", appleMusicFixture.loadArtistPage("apple-music-foo"));

    assert.strict.equal(await getArtistImage("https://foo.com"), config.get("media.placeholderImage"));
    assert.strict.equal(await getArtistImage("https://foo.com"), config.get("media.placeholderImage"));
  });
});
