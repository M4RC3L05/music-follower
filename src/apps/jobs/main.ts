import process from "node:process";

import { makeLogger } from "#src/common/logger/mod.js";
import { addHook } from "#src/common/utils/process-utils.js";
import { type Job } from "./common/mod.js";

const log = makeLogger("main");

const [jobName] = process.argv.slice(2);

if (!jobName) {
  throw new Error("No job name provided");
}

const { job } = (await import(`./${jobName}/job.js`)) as { job: Job };

if (!job) {
  throw new Error(`No job "${jobName}" found.`);
}

addHook({
  async handler() {
    await job.terminate();
  },
  name: `${jobName}-job`,
});

if (typeof process.send === "function") {
  log.info("Sending ready signal");

  process.send("ready");
}

log.info({ nextDate: job.cron.nextAt(), job: jobName }, "Starting job");

for await (const s of job.cron.start()) {
  try {
    log.info(`Running "${jobName}" task`);

    await job.task.run(s);
  } catch (error: unknown) {
    log.error(`Error running "${jobName}" task`, { error });
  } finally {
    log.info(`"${jobName}" task completed`);
    log.info(`Next at ${job.cron.nextAt() ?? "unknown"}`);
  }
}
