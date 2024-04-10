import { delay } from "@std/async";
import { makeLogger } from "#src/common/logger/mod.ts";

const log = makeLogger("fetch-utils");

type RequestOptions =
  & { retryTimeout?: number; maxRetries?: number }
  & Record<string, unknown>;

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
      delay(8000, { persistent: false }).then(() => {
        throw new Error(`Request timeout exceeded for "${url}"`);
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
      log.error("Could not fetch, proceed to retry", { error });
      log.info(
        `Try Nº ${normalizedOptions.retryNumber}, retrying in 2 seconds`,
      );

      await delay(normalizedOptions.retryTimeout, {
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
