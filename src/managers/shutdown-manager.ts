import process from "node:process";
import { setTimeout } from "node:timers/promises";
import { makeLogger } from "#src/common/logger/mod.js";

type ShutdownHookHandler = () => Promise<void> | void;

type ShutdownHook = {
  name: string;
  handler: ShutdownHookHandler;
};

const log = makeLogger("shutdown-manager");

class ShutdownManager {
  #handlers: ShutdownHook[] = [];
  #signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGABRT", "SIGUSR2"];
  #shuttingDown = false;
  #abortController = new AbortController();

  constructor() {
    const processErrors = (error: unknown) => {
      log.error(
        typeof error === "object" ? error : { error },
        "Uncaught/Unhandled",
      );

      if (this.#shuttingDown)
        log.info("Ignoring Uncaught/Unhandled has the app is shutting down.");
      else process.emit("SIGUSR2");
    };

    process.on("uncaughtException", processErrors);
    process.on("unhandledRejection", processErrors);

    for (const signal of this.#signals) {
      process.on(signal, this.#processSignal.bind(this));
    }

    process.on("exit", (code) => {
      log.info(`Exiting with status code of ${code}`);
    });
  }

  get abortSignal() {
    return this.#abortController.signal;
  }

  addHook(name: string, handler: ShutdownHookHandler) {
    log.info(`Registered "${name}" hook`);

    this.#handlers.push({ handler, name });
  }

  async #processSignal(signal: NodeJS.Signals) {
    if (this.#shuttingDown) {
      log.warn(
        { signal },
        "Ignoring process exit signal has the app is shutting down.",
      );

      return;
    }

    log.info({ signal }, "Processing exit signal");

    this.#shuttingDown = true;
    let withError = false;

    this.#abortController.abort();

    for (const { name, handler } of this.#handlers) {
      log.info(`Processing "${name}" hook`);

      try {
        const response = await Promise.race([
          handler(),
          setTimeout(8000, "timeout", { ref: false }),
        ]);

        if (response === "timeout") {
          withError = true;
        }

        log.info(`Successful "${name}" hook`);
      } catch (error: unknown) {
        log.error(
          error instanceof Error ? error : { error },
          `Unsuccessful "${name}" hook`,
        );

        withError = true;
      }
    }

    log.info({ signal }, "Exit signal process completed");

    if (withError) {
      log.warn(
        "Looks like some handlers where not able to be processed gracefully",
      );

      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  }
}

export default ShutdownManager;
