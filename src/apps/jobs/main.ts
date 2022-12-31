import process from "node:process";

import yargs from "yargs";

import { type Cron } from "#src/utils/cron/cron.js";
import logger from "#src/utils/logger/logger.js";
import { onProcessSignals } from "#src/utils/process/process.js";

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

process.once("uncaughtException", (error, origin) => {
  log.error("Uncaught exception", { error, origin });

  process.emit("SIGUSR2");
});

process.once("unhandledRejection", (reason, promise) => {
  log.error("Unhandled rejection", { reason, promise });

  process.emit("SIGUSR2");
});

onProcessSignals({
  signals: ["SIGINT", "SIGTERM", "SIGUSR2"],
  async handler() {
    await job.stop();

    log.info(`Job "${program.name!}" stopped`);
  },
  name: import.meta.url,
});

if (typeof process.send === "function") {
  log.info("Sending ready signal");

  process.send("ready");
}

log.info("Registered job", { nextDate: job.nextTime().toISOString(), job: program.name });

for await (const s of job.start()!) {
  try {
    log.info(`Running "${program.name!}" task`);

    await task(s);
  } catch (error: unknown) {
    log.error(`Error running "${program.name!}" task`, { error });
  } finally {
    log.info(`"${program.name!}" task completed`);
  }
}
