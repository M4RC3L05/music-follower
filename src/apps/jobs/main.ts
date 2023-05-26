import process from "node:process";

import * as jobs from "./mod.js";
import { addHook } from "#src/common/utils/process-utils.js";
import logger from "#src/common/clients/logger.js";

const log = logger("main");

const [jobName] = process.argv.slice(2);

if (!(jobName in jobs)) {
  throw new Error(`No job "${jobName}" found.`);
}

const { job, task } = jobs[jobName as keyof typeof jobs];

addHook({
  async handler() {
    await job.stop();

    log.info(`Job "${jobName}" stopped`);
  },
  name: `${jobName}-job`,
});

if (typeof process.send === "function") {
  log.info("Sending ready signal");

  process.send("ready");
}

log.info({ nextDate: job.nextTime(), job: jobName }, "Registered job");

for await (const s of job.start()!) {
  try {
    log.info(`Running "${jobName}" task`);

    await task(s);
  } catch (error: unknown) {
    log.error(`Error running "${jobName}" task`, { error });
  } finally {
    log.info(`"${jobName}" task completed`);
    log.info(`Next at ${job.nextTime() ?? "unknown"}`);
  }
}
