import { type AddressInfo } from "node:net";
import http from "node:http";
import process from "node:process";
import { promisify } from "node:util";

import config from "config";

import { addHook } from "#src/common/utils/process-utils.js";
import { makeApp } from "./app.js";
import { makeLogger } from "#src/common/logger/mod.js";

const log = makeLogger("main");
const app = await makeApp();
const { host, port } = config.get<{ host: string; port: number }>("apps.admin");

const server = http.createServer(app.handle());
const pClose = promisify<void>(server.close).bind(server);

server.listen(port, host, () => {
  const addr = server.address() as AddressInfo;
  log.info(`Listening on ${addr.address}:${addr.port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

addHook({
  async handler() {
    await pClose().catch((error) => {
      log.error(error, "Could not close server");
    });
    log.info("Server closed");
  },
  name: "admin",
});
