import process from "node:process";
import { promisify } from "node:util";

import config from "config";

import { addHook } from "#src/common/utils/process-utils.js";
import { app } from "./app.js";
import { logger } from "#src/common/logger/mod.js";

const log = logger("main");
const api = app();
const { host, port } = config.get<{ host: string; port: number }>("apps.api");

const server = api.listen(port, host, () => {
  log.info(`Live at ${host}:${port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

const pClose = promisify<void>(server.close).bind(server);

addHook({
  async handler() {
    await pClose();

    log.info("Server terminated");
  },
  name: "api",
});
