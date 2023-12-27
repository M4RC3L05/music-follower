import config from "config";

import { makeLogger } from "#src/common/logger/mod.js";
import { Cron } from "#src/common/utils/cron-utils.js";
import { makeDatabase } from "#src/database/mod.js";
import { type Job } from "../common/mod.js";
import { run } from "./task.js";

const { pattern, timezone, tickerTimeout } = config.get<{
  pattern: string;
  tickerTimeout?: number;
  timezone: string;
}>("apps.jobs.sync-releases.cron");

const log = makeLogger("sync-releases-job");
const database = makeDatabase();
const cron = new Cron(pattern, timezone, tickerTimeout);

export const job: Job = {
  cron,
  task: { run: run(database) },
  async terminate() {
    await cron.stop().catch((error) => {
      log.error(error, "Unable to stop cron");
    });

    log.info("Cron stopped");

    database.close();

    log.info("Database closed");
  },
};
