import process from "node:process";

import config from "config";

import { app } from "#src/apps/feed/app.js";
import logger from "#src/utils/logger/logger.js";
import { onProcessSignals } from "#src/utils/process/process.js";

const log = logger("main");
const api = app();
const { host, port } = config.get<{ host: string; port: number }>("apps.feed");

const server = api.listen(port, host, () => {
  const addr = server.address();

  if (typeof addr === "string") {
    log.info(`Live at ${addr}`);
  } else {
    log.info(`Live at ${addr!.address}:${addr!.port}`);
  }

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

process.addListener("uncaughtException", (error, origin) => {
  log.error("Uncaught exception", { error, origin });

  process.emit("SIGUSR2");
});

process.addListener("unhandledRejection", (reason, promise) => {
  log.error("Unhandled rejection", { reason, promise });

  process.emit("SIGUSR2");
});

onProcessSignals({
  signals: ["SIGINT", "SIGTERM", "SIGUSR2"],
  async handler() {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);

          return;
        }

        resolve();
      });
    });

    log.info("Server terminated");
  },
  name: import.meta.url,
});
