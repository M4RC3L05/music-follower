import config from "config";
import gracefullShutdown from "http-graceful-shutdown";
import { Model } from "objection";

import { app } from "#src/apps/admin/app.js";
import { knex } from "#src/core/clients/knex.js";
import { makeLogger } from "#src/core/clients/logger.js";

Model.knex(knex);

const logger = makeLogger("main");
const api = app();
const { host, port } = config.get<{ host: string; port: number }>("apps.admin");

const server = api.listen(port, host, () => {
  const addr = server.address();

  if (typeof addr === "string") {
    logger.info(`Live at ${addr}`);
  } else {
    logger.info(`Live at ${addr.address}:${addr.port}`);
  }

  if (typeof process.send === "function") {
    logger.info("Sending ready signal");

    process.send("ready");
  }
});

gracefullShutdown(server, {
  development: process.env.NODE_ENV !== "production",
  forceExit: false,
  finally() {
    logger.info("Server terminated");
  },
});
