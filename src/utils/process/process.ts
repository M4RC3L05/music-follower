import process from "node:process";

import logger from "#src/utils/logger/logger.js";

type ProcessSignals = {
  signals: NodeJS.Signals[];
  name: string;
  handler: () => Promise<void> | void;
};

type OnSignal = {
  signal: NodeJS.Signals;
  handler: () => Promise<void> | void;
  name: string;
};

const log = logger("process");

const onSignal = ({ handler, signal, name }: OnSignal) => {
  return async () => {
    log.info({ name }, `Running handlers for signal "${signal}"`);

    try {
      await handler();

      log.info({ name }, `Handler successfull for "${signal}"`);
    } catch (error: unknown) {
      log.info({ error, name }, `Handler error for "${signal}"`);
    }
  };
};

export const onProcessSignals = ({ handler, signals, name }: ProcessSignals) => {
  log.info({ signals, name }, "Register for signal");

  for (const signal of signals) {
    process.once(signal, onSignal({ signal, handler, name }));
  }
};
