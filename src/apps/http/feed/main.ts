import process from "node:process";

import config from "config";

import { addHook } from "#src/utils/process/process.js";
import { app } from "#src/apps/http/feed/app.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("main");
const api = app();
const { host, port } = config.get<{ host: string; port: number }>("apps.feed");

const server = api.listen(port, host, () => {
  log.info(`Live at ${host}:${port}`);

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
  name: "feed",
});
