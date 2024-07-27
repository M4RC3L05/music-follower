import type { Logger } from "@std/log";
import type { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";

export const gracefulShutdown = (
  { processLifecycle, log }: {
    processLifecycle: ProcessLifecycle;
    log: Logger;
  },
) => {
  processLifecycle.on("bootStarted", () => {
    log.info("Process boot started");
  });

  processLifecycle.on("bootEnded", ({ error }) => {
    if (error) {
      log.error("Process boot ended with error", { error });
    } else {
      log.info("Process boot ended");
    }
  });

  processLifecycle.on("shutdownStarted", () => {
    log.info("Process shutdown started");
  });

  processLifecycle.on("shutdownEnded", ({ error }) => {
    if (error) {
      log.error("Process shutdown ended with error", { error });
    } else {
      log.info("Process shutdown ended");
    }

    Deno.exitCode = error ? 1 : 0;
  });

  processLifecycle.on("bootServiceStarted", ({ name }) => {
    log.info(`Service "${name}" boot started`);
  });

  processLifecycle.on("bootServiceEnded", ({ name, error }) => {
    if (error) {
      log.error(`Service "${name}" boot ended with error`, { error });
    } else {
      log.info(`Service "${name}" boot ended`);
    }
  });

  processLifecycle.on("shutdownServiceStarted", ({ name }) => {
    log.info(`Service "${name}" shutdown started`);
  });

  processLifecycle.on("shutdownServiceEnded", ({ name, error }) => {
    if (error) {
      log.error(`Service "${name}" shutdown ended with error`, { error });
    } else {
      log.info(`Service "${name}" shutdown ended`);
    }
  });

  for (const signal of ["SIGABRT", "SIGTERM", "SIGINT"] as Deno.Signal[]) {
    Deno.addSignalListener(signal, () => {
      log.info(`OS Signal "${signal}" captured`);

      processLifecycle.shutdown();
    });
  }

  globalThis.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();

    log.error("Unhandled rejection captured", { reason: e.reason });

    processLifecycle.shutdown();
  });

  globalThis.addEventListener("error", (e) => {
    e.preventDefault();

    log.error("Unhandled error captured", { error: e.error });

    processLifecycle.shutdown();
  });

  globalThis.onunload = () => {
    processLifecycle.shutdown();
  };
};
