import process from "node:process";

import config from "config";
import { Model } from "objection";

import { app } from "#src/apps/feed/app.js";
import { knex } from "#src/core/clients/knex.js";
import makeLogger from "#src/core/clients/logger.js";
import { onProcessSignals } from "#src/core/process/process.js";

Model.knex(knex);

const logger = makeLogger(import.meta.url);
const api = app();
const { host, port } = config.get<{ host: string; port: number }>("apps.feed");

const server = api.listen(port, host, () => {
  const addr = server.address();

  if (typeof addr === "string") {
    logger.info(`Live at ${addr}`);
  } else {
    logger.info(`Live at ${addr!.address}:${addr!.port}`);
  }

  if (typeof process.send === "function") {
    logger.info("Sending ready signal");

    process.send("ready");
  }
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

    logger.info("Server terminated");
  },
  name: import.meta.url,
});
