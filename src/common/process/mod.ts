import { makeLogger } from "#src/common/logger/mod.ts";

export const gracefulShutdown = () => {
  const log = makeLogger("gracefull-shutdown");
  const abortController = new AbortController();
  const { promise, resolve } = Promise.withResolvers<void>();
  let exitCode = 0;

  abortController.signal.addEventListener("abort", () => {
    resolve();
  });

  const abort = () => {
    if (!abortController.signal.aborted) abortController.abort();
  };

  if (Deno.env.get("BUILD_DRY_RUN") === "true") {
    abort();
  }

  for (const signal of ["SIGABRT", "SIGTERM", "SIGINT"] as Deno.Signal[]) {
    Deno.addSignalListener(signal, () => {
      log.info(`OS Signal "${signal}" captured`);

      abort();
    });
  }

  globalThis.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();

    log.error("Unhandled rejection captured", { reason: e.reason });

    exitCode = 1;

    abort();
  });

  globalThis.addEventListener("error", (e) => {
    e.preventDefault();

    log.error("Unhandled error captured", { error: e.error });

    exitCode = 1;

    abort();
  });

  globalThis.onbeforeunload = () => {
    abort();
  };

  globalThis.onunload = () => {
    Deno.exitCode = exitCode;
    log.info(`Existing process with status "${Deno.exitCode}"`);
  };

  const shutdownP = promise.then(() => {
    // Force exit after 10 seconds.
    Deno.unrefTimer(
      setTimeout(() => {
        log.error("Process force to exit");

        Deno.exit(1);
      }, 10_000),
    );
  });

  return {
    promise: shutdownP,
    signal: abortController.signal,
    done: () => {
      abort();

      return shutdownP;
    },
  };
};
