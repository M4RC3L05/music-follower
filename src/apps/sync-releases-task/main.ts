import { run } from "#src/apps/sync-releases-task/task.js";
import { makeLogger } from "#src/core/clients/logger.js";
import { CronJob } from "cron";

const logger = makeLogger("main.ts");

logger.info("Registering `sync-release-task` cron job");

const job = new CronJob("0 12 * * *", async () => {
  try {
    await run();

    logger.info("`sync-release-task` finisehd");
  } catch (error: unknown) {
    logger.error(error, "Failed to run `sync-release-task` cron job.");
  } finally {
    logger.info(`Next at ${job.nextDate().toISO()}`);
  }
});

job.start();

if (typeof process.send === "function") {
  process.send("ready");
}

logger.info({ nextDate: job.nextDate() }, "Registered `sync-release-task` cron job");
