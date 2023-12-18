import process from "node:process";

import config from "config";
import { createAdaptorServer } from "@hono/node-server";

import { addHook } from "#src/common/utils/process-utils.js";
import { makeApp } from "./app.js";
import { makeLogger } from "#src/common/logger/mod.js";

addHook({
  name: "admin",
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
  },
});

const { port, host } = config.get<{ port: number; host: string }>("apps.admin");
const log = makeLogger("admin");

const app = makeApp();
const server = createAdaptorServer(app);

server.listen({ port, hostname: host }, () => {
  log.info(`Listening on ${host}:${port}`);
});

server.once("listening", () => {
  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});
