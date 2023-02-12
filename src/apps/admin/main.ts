import process from "node:process";

import config from "config";

import { addHook } from "#src/utils/process/process.js";
import { app } from "#src/apps/admin/app.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("main");
const api = app();
const { host, port } = config.get<{ host: string; port: number }>("apps.admin");

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

addHook({
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
  name: "admin",
});
