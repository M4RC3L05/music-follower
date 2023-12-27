import process from "node:process";

import { createAdaptorServer } from "@hono/node-server";
import config from "config";

import { makeLogger } from "#src/common/logger/mod.js";
import { addHook } from "#src/common/utils/process-utils.js";
import { makeDatabase } from "#src/database/mod.js";
import { makeApp } from "./app.js";

addHook({
  name: "api",
  async handler() {
    if (server) {
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        log.info("Server closed");
      } catch (error) {
        log.error(error, "Error while closing server");
      }
    }

    if (database?.open) {
      database.close();

      log.info("DB Closed");
    }
  },
});

const { port, host } = config.get<{ port: number; host: string }>("apps.api");
const log = makeLogger("api");

const database = makeDatabase();
const app = makeApp({ database });
const server = createAdaptorServer(app);

server.listen({ port, hostname: host }, () => {
  log.info(`Listening on ${host}:${port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});
