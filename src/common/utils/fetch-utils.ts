import { setTimeout } from "node:timers/promises";
import fetch, { type Response } from "node-fetch";
import { makeLogger } from "../logger/mod.js";

const log = makeLogger("fetch-utils");

type RequestOptions = { retryTimeout?: number; maxRetries?: number } & Record<
  string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  any
>;

export const request = async (
  url: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
  options?: RequestOptions,
): Promise<Response> => {
  const normalizedOptions = {
    retryNumber: 0,
    maxRetries: 0,
    retryTimeout: 2000,
    ...(options ?? {}),
  };

  try {
    const result = await Promise.race([
      setTimeout(8000, new Error(`Request timeout exceeded for "${url}"`), {
        ref: false,
      }),
      fetch(url, init),
    ]);

    if (result instanceof Error) {
      throw result;
    }

    return result;
  } catch (error: unknown) {
    if ((error as { name: string })?.name === "AbortError") {
      throw error;
    }

    if (normalizedOptions.maxRetries <= 0) throw error;

    if (normalizedOptions.retryNumber < normalizedOptions.maxRetries) {
      log.error(error, "Could not fetch, proceed to retry");
      log.info(
        `Try Nº ${normalizedOptions.retryNumber}, retrying in 2 seconds`,
      );

      await setTimeout(normalizedOptions.retryTimeout, undefined, {
        signal: init?.signal as AbortSignal,
      });

      return request(url, init, {
        ...normalizedOptions,
        retryNumber: normalizedOptions.retryNumber + 1,
      });
    }

    throw new Error("Retries exhausted", { cause: error });
  }
};
