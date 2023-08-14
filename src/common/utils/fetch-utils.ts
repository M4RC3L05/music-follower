import { setTimeout } from "node:timers/promises";

import logger from "#src/common/clients/logger.js";

const log = logger("fetch-utils");

export const request = async (
  url: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  options: { retryN: number },
): Promise<Response> => {
  try {
    const result = await Promise.race([
      setTimeout(8000, new Error(`Request timeout excedded for "${url as any as string}"`), {
        signal: init?.signal as any as AbortSignal,
      }),
      fetch(url, init),
    ]);

    if (result instanceof Error) {
      throw result;
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (options.retryN <= 3) {
      log.error(error, "Could not fetch, proceed to retry");
      log.info(`Retry Nº ${options.retryN}, retrying in 2 seconds`);

      await setTimeout(2000, undefined, {
        signal: init?.signal as any as AbortSignal,
      });

      return request(url, init, { ...options, retryN: options.retryN + 1 });
    }

    throw new Error("Retrys exausted");
  }
};
