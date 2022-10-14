import config from "config";
import Knex from "knex";

import makeLogger from "#src/core/clients/logger.js";
import { onProcessSignals } from "#src/core/process/process.js";

const logger = makeLogger(import.meta.url);

export const knex = Knex.knex(config.get("database"));

onProcessSignals({
  signals: ["SIGINT", "SIGTERM", "SIGUSR2"],
  async handler() {
    await knex.destroy();

    logger.info("Knex terminated");
  },
  name: import.meta.url,
});
