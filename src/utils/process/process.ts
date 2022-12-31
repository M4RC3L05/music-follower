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
    log.info(`Running handlers for signal "${signal}"`, { name });

    try {
      await handler();

      log.info(`Handler successfull for "${signal}"`, { name });
    } catch (error: unknown) {
      log.info(`Handler error for "${signal}"`, { error, name });
    }
  };
};

export const onProcessSignals = ({ handler, signals, name }: ProcessSignals) => {
  log.info("Register for signal", { signals, name });

  for (const signal of signals) {
    process.once(signal, onSignal({ signal, handler, name }));
  }
};
