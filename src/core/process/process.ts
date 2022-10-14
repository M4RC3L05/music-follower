import makeLogger from "#src/core/clients/logger.js";

const log = makeLogger(import.meta.url);

function onSignal({
  signal,
  name,
  handler,
}: {
  signal: NodeJS.Signals;
  name: string;
  handler: () => Promise<void> | void;
}) {
  return async () => {
    log.info({ signal, name }, "Running handlers for signal");

    try {
      await handler();

      log.info({ signal, name }, "Handler successfull");
    } catch (error: unknown) {
      log.error(error, "Process handler unsuccessfull");
    }
  };
}

export function onProcessSignals({
  handler,
  signals,
  name,
}: {
  signals: NodeJS.Signals[];
  name: string;
  handler: () => Promise<void> | void;
}) {
  for (const signal of signals) {
    log.info({ signal, name }, "Register for signal");

    process.once(signal, onSignal({ signal, name, handler }));
  }
}
