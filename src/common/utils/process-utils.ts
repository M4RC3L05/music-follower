import process from "node:process";
import { setTimeout } from "node:timers/promises";

import { makeLogger } from "../logger/mod.js";

type ProcessHook = {
  name: string;
  handler: () => Promise<void> | void;
};

const log = makeLogger("process");
const processHooks: ProcessHook[] = [];
const signalsToWatch = ["SIGTERM", "SIGINT", "SIGUSR2"];
let processing = false;

export const addHook = (hook: ProcessHook) => {
  log.info(`Registered "${hook.name}" hook`);
  processHooks.push(hook);
};

const processSignal = async (signal: NodeJS.Signals) => {
  if (processing) {
    log.warn("Ignoring process exit signal has the app is shutting down.");
    return;
  }

  log.info({ signal }, "Processing exit signal");

  processing = true;
  let forceQuit = false;

  for (const { name, handler } of processHooks) {
    log.info(`Processing "${name}" hook`);

    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await Promise.race([handler(), setTimeout(8000, "force-quit", { ref: false })]);

      if (response === "force-quit") {
        forceQuit = true;
      }

      log.info(`Successfull "${name}" hook`);
    } catch (error: unknown) {
      log.error(error, `Unsuccessfull "${name}" hook`);
    }
  }

  for (const signal of signalsToWatch) process.removeListener(signal, processSignal);

  if (forceQuit) {
    log.warn("Looks like some handlers where not hable to be processed gracefully, forcing nodejs process shutdown");
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  } else {
    log.info({ signal }, "Exit signal process completed");

    processing = false;
  }
};

const processErrors = (error: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  log.error(typeof error === "object" ? error : { error }, "Uncaught/Unhandled");

  if (processing) log.info("Ignoring Uncaught/Unhandled has the app is shutting down.");
  else process.emit("SIGUSR2");
};

process.on("uncaughtException", processErrors);
process.on("unhandledRejection", processErrors);

for (const signal of signalsToWatch) {
  process.on(signal, processSignal);
}
