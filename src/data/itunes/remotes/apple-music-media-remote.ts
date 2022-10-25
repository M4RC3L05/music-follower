import config from "config";
import LRU from "lru-cache";
import fetch from "node-fetch";

import makeLogger from "#src/core/clients/logger.js";

const logger = makeLogger(import.meta.url);

class AppleMusicMediaRemote {
  #cache = new LRU({ max: 10_000, ttl: 1000 * 60 * 60 * 24 });

  async getArtistImage(url: string) {
    logger.info({ url }, "Getting image for artist");

    if (!this.#cache.has(url)) {
      logger.info({ url }, "Artist not in cache, requesting for image");

      const response = await fetch(url);

      if (!response.ok) {
        logger.error({ status: response.status }, "Could not fetch artists image");

        throw new Error("An error ocurred while searching for artist image");
      }

      const html = await new Promise<string>((resolve, _reject) => {
        let temporary = "";

        response.body!.on("data", (chunk) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          temporary += chunk.toString() as string;

          if (/<meta property="og:image".*>/.test(temporary)) {
            resolve(temporary);

            response.body!.removeAllListeners();
          }
        });
      });

      const result = /<meta\s+property="og:image"\s+content="([^"]*)"/gm.exec(html)?.at(1);

      if (!result || result.includes("apple-music-")) {
        this.#cache.set(url, config.get("media.placeholderImage"));

        logger.info({ url, image: result }, "Image is not for a artist, using placeholder");
      } else {
        const imageSplitted = result.split("/");
        const imageFile = imageSplitted.at(-1)!.split(".");
        imageSplitted[imageSplitted.length - 1] = `256x256.${imageFile.at(1)!}`;

        logger.info({ url, image: imageSplitted.join("/") }, "Retrieved image for artist");

        this.#cache.set(url, imageSplitted.join("/"));
      }
    }

    return this.#cache.get(url);
  }
}

export default new AppleMusicMediaRemote();