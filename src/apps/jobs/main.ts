import process from "node:process";

import * as jobs from "./mod.js";
import { addHook } from "#src/common/utils/process-utils.js";
import { db } from "#src/common/database/mod.js";
import { makeLogger } from "#src/common/logger/mod.js";

const log = makeLogger("main");

const [jobName] = process.argv.slice(2);

if (!(jobName in jobs)) {
  throw new Error(`No job "${jobName}" found.`);
}

const { job, task } = jobs[jobName as keyof typeof jobs];

addHook({
  async handler() {
    await job.stop().catch((error) => {
      log.error(error, "Could not close job");
    });

    log.info(`Job "${jobName}" stopped`);

    db.close();
    log.info("DB Closed");
  },
  name: `${jobName}-job`,
});

if (typeof process.send === "function") {
  log.info("Sending ready signal");

  process.send("ready");
}

log.info({ nextDate: job.nextAt(), job: jobName }, "Registered job");

for await (const s of job.start()!) {
  try {
    log.info(`Running "${jobName}" task`);

    await task(s);
  } catch (error: unknown) {
    log.error(`Error running "${jobName}" task`, { error });
  } finally {
    log.info(`"${jobName}" task completed`);
    log.info(`Next at ${job.nextAt() ?? "unknown"}`);
  }
}
