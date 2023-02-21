import { afterEach, describe, expect, it } from "vitest";
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

      expect.fail("no throw");
      // eslint-disable-next-line @typescript-eslint/no-implicit-any-catch
    } catch (error: any) {
      expect(error.message).toBe("An error ocurred while searching for artist image");
    }
  });

  it("should get artist image from apple music profile url", async () => {
    fixtures.nock.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("https://foo.com/foo.png"),
    );

    expect(await getArtistImage("https://foo.com")).toBe("https://foo.com/256x256.png");
  });

  it("should use placeholder if it cannot parse artist image url", async () => {
    fixtures.nock.getAppleMusicArtistPage(200, "https://foo.com", fixtures.appleMusic.loadArtistPage(""));
    fixtures.nock.getAppleMusicArtistPage(
      200,
      "https://foo.com",
      fixtures.appleMusic.loadArtistPage("apple-music-foo"),
    );

    expect(await getArtistImage("https://foo.com")).toBe(config.get("media.placeholderImage"));
    expect(await getArtistImage("https://foo.com")).toBe(config.get("media.placeholderImage"));
  });
});
