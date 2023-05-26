import process from "node:process";

import logger from "#src/common/clients/logger.js";

type ProcessHook = {
  name: string;
  handler: () => Promise<void> | void;
};

const log = logger("process");
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

  for (const { name, handler } of processHooks) {
    log.info(`Processing "${name}" hook`);

    try {
      // eslint-disable-next-line no-await-in-loop
      await handler();

      log.info(`Successfull "${name}" hook`);
    } catch (error: unknown) {
      log.error(error, `Unsuccessfull "${name}" hook`);
    }
  }

  for (const signal of signalsToWatch) process.removeListener(signal, processSignal);

  log.info({ signal }, "Exit signal process completed");

  processing = false;
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
