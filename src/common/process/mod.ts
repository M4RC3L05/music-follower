import type { Logger } from "@std/log";
import { formatError } from "#src/common/logger/mod.ts";
import type { HookDrain } from "./hook-drain.ts";

export const gracefulShutdown = (
  { hookDrain, log }: { hookDrain: HookDrain; log: Logger },
) => {
  for (const signal of ["SIGABRT", "SIGTERM", "SIGINT"] as Deno.Signal[]) {
    Deno.addSignalListener(signal, () => {
      log.info(`OS Signal "${signal}" captured`);

      hookDrain.drain();
    });
  }

  globalThis.addEventListener("unhandledrejection", (e) => {
    log.error("Unhandled rejection captured", {
      reason: e.reason instanceof Error ? formatError(e.reason) : e.reason,
    });

    e.preventDefault();

    hookDrain.drain();
  });

  globalThis.addEventListener("error", (e) => {
    log.error("Unhandled error captured", { error: e.error });

    e.preventDefault();

    hookDrain.drain();
  });
};
