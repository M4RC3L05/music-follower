import config from "config";
import fetch from "node-fetch";

import { logger } from "#src/common/logger/mod.js";

const log = logger("apple-music-source");

export const getArtistImage = async (url: string) => {
  log.info({ url }, "Getting image for artist");

  const response = await fetch(url);

  if (!response.ok) {
    log.error({ status: response.status }, "Could not fetch artists image");

    throw new Error("An error ocurred while searching for artist image");
  }

  let html = "";

  for await (const chunk of response.body!) {
    html += chunk.toString();

    if (/<meta property="og:image".*>/.test(html)) {
      break;
    }
  }

  const result = /<meta\s+property="og:image"\s+content="([^"]*)"/gm.exec(html)?.at(1);

  if (!result || result.includes("apple-music-")) {
    log.info({ url, image: result }, "Image is not for a artist, using placeholder");

    return config.get("media.placeholderImage");
  }

  const imageSplitted = result.split("/");
  const imageFile = imageSplitted.at(-1)!.split(".");
  imageSplitted[imageSplitted.length - 1] = `256x256.${imageFile.at(1)!}`;

  log.info({ url, image: imageSplitted.join("/") }, "Retrieved image for artist");

  return imageSplitted.join("/");
};
