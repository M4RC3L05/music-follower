import config from "config";

import { makeLogger } from "#src/common/logger/mod.ts";

const log = makeLogger("apple-music-source");
const textDecoder = new TextDecoder();

export const getArtistImage = async (url: string) => {
  log.info("Getting image for artist", { url });

  const response = await fetch(url);

  if (!response.ok) {
    log.error("Could not fetch artists image", { status: response.status });

    throw new Error("An error ocurred while searching for artist image");
  }

  let html = "";

  if (!response.body) {
    throw new Error("Artists image request has no body");
  }

  for await (const chunk of response.body) {
    html += textDecoder.decode(chunk);

    if (/<meta property="og:image".*>/.test(html)) {
      break;
    }
  }

  const result = /<meta\s+property="og:image"\s+content="([^"]*)"/gm
    .exec(html)
    ?.at(1);

  if (!result || result.includes("apple-music-")) {
    log.info(
      "Image is not for a artist, using placeholder",
      { url, image: result },
    );

    return config.get("media.placeholderImage");
  }

  const imageSplitted = result.split("/");
  const imageFile = imageSplitted.at(-1)?.split(".");

  if (!imageFile) {
    throw new Error(
      `Could not get the image for the artists on result: "${result}"`,
    );
  }

  imageSplitted[imageSplitted.length - 1] = `256x256.${imageFile.at(1)}`;

  log.info(
    "Retrieved image for artist",
    { url, image: imageSplitted.join("/") },
  );

  return imageSplitted.join("/");
};
