import process from "node:process";
import { promisify } from "node:util";

import config from "config";

import { addHook } from "#src/common/utils/process-utils.js";
import { makeApp } from "./app.js";
import { makeLogger } from "#src/common/logger/mod.js";

const log = makeLogger("main");
const api = await makeApp();
const { host, port } = config.get<{ host: string; port: number }>("apps.admin");

const server = api.listen(port, host, () => {
  log.info(`Live at ${host}:${port}`);
  const addr = server.address();

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

const pClose = promisify<void>(server.close).bind(server);

addHook({
  async handler() {
    await pClose().catch((error) => {
      log.error(error, "Could not close server");
    });
    log.info("Server closed");
  },
  name: "admin",
});
