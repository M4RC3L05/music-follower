import LRUCache from "lru-cache";

import { getArtistImage } from "#src/remote/sources/apple-music/requests.js";
import logger from "#src/utils/logger/logger.js";

const cache = new LRUCache({ max: 10_000, ttl: 1000 * 60 * 60 * 24 });
const log = logger("apple-music-remote");

const cacheFn = <F extends (...args: any[]) => unknown>(fn: F) => {
  return (...args: Parameters<F>): ReturnType<F> => {
    const stringifyArgs = JSON.stringify(args);

    if (!cache.has(stringifyArgs)) {
      log.info({ args }, "Not in cache, requesting");

      cache.set(stringifyArgs, fn(...args));
    }

    return cache.get(stringifyArgs)!;
  };
};

export const appleMusicRequests = { getArtistImage: cacheFn(getArtistImage) };
