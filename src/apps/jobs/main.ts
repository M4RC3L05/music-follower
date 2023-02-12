/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import process from "node:process";

import yargs from "yargs";

import { type Cron } from "#src/utils/cron/cron.js";
import { addHook } from "#src/utils/process/process.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("main");

const program = await yargs(process.argv.splice(2))
  .command("job [name]", "run a specifique job", (yrgs) =>
    yrgs.positional("name", { type: "string", describe: "The name of the job to run" }),
  )
  .parse();

const { job, task } = (await import(`#src/apps/jobs/${program.name!}/job.ts`)) as {
  job: Cron;
  task: (as: AbortSignal) => Promise<void> | void;
};

process.once("uncaughtException", (error) => {
  log.error(error, "Uncaught exception");

  process.emit("SIGUSR2");
});

process.once("unhandledRejection", (reason, promise) => {
  log.error({ reason, promise }, "Unhandled rejection");

  process.emit("SIGUSR2");
});

addHook({
  async handler() {
    await job.stop();

    log.info(`Job "${program.name!}" stopped`);
  },
  name: `${program.name!}-job`,
});

if (typeof process.send === "function") {
  log.info("Sending ready signal");

  process.send("ready");
}

log.info({ nextDate: job.nextTime().toISOString(), job: program.name }, "Registered job");

for await (const s of job.start()!) {
  try {
    log.info(`Running "${program.name!}" task`);

    await task(s);
  } catch (error: unknown) {
    log.error(`Error running "${program.name!}" task`, { error });
  } finally {
    log.info(`"${program.name!}" task completed`);
    log.info(`Next at ${job.nextTime()?.toISOString()}`);
  }
}
