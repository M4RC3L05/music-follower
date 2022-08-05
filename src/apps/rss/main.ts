import gracefullShutdown from "http-graceful-shutdown";
import { app } from "#src/apps/rss/app.js";
import { makeLogger } from "#src/core/clients/logger.js";
import { Model } from "objection";
import { knex } from "#src/core/clients/knex.js";

Model.knex(knex);

const logger = makeLogger("main");
const api = app();

const server = api.listen(4321, "0.0.0.0", () => {
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
