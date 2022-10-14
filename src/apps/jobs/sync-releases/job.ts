import config from "config";
import { CronJob } from "cron";

import { run } from "#src/apps/jobs/sync-releases/task.js";
import makeLogger from "#src/core/clients/logger.js";

const log = makeLogger(import.meta.url);

export const job = new CronJob(config.get<string>("apps.jobs.sync-releases.cron"), async () => {
  try {
    await run();

    log.info("`sync-releases` finished");
  } catch (error: unknown) {
    log.error(error, "Failed to run `sync-releases` cron job.");
  } finally {
    log.info(`Next at ${job.nextDate().toISO()}`);
  }
});
