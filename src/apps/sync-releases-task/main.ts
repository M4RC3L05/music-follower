import config from "config";
import { CronJob } from "cron";
import { Model } from "objection";

import { run } from "#src/apps/sync-releases-task/task.js";
import { knex } from "#src/core/clients/knex.js";
import { makeLogger } from "#src/core/clients/logger.js";

const logger = makeLogger("main.ts");

Model.knex(knex);

logger.info("Registering `sync-release-task` cron job");

const job = new CronJob(config.get<string>("apps.sync-releases-task.cron"), async () => {
  try {
    await run();

    logger.info("`sync-release-task` finished");
  } catch (error: unknown) {
    logger.error(error, "Failed to run `sync-release-task` cron job.");
  } finally {
    logger.info(`Next at ${job.nextDate().toISO()}`);
  }
});

job.start();

if (typeof process.send === "function") {
  logger.info("Sending ready signal");

  process.send("ready");
}

logger.info({ nextDate: job.nextDate() }, "Registered `sync-release-task` cron job");
