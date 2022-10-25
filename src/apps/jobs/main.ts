import process from "node:process";

import type { CronJob } from "cron";
import { Model } from "objection";
import yargs from "yargs";
// @ts-expect-error no typedefs
import { hideBin } from "yargs/helpers.mjs";

import { knex } from "#src/core/clients/knex.js";
import makeLogger from "#src/core/clients/logger.js";
import { onProcessSignals } from "#src/core/process/process.js";

const logger = makeLogger(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const program = await yargs(hideBin(process.argv))
  .command("job [name]", "run a specifique job", (yrgs) =>
    yrgs.positional("name", { type: "string", describe: "The name of the job to run" }),
  )
  .parse();

Model.knex(knex);

const { job } = (await import(`#src/apps/jobs/${program.name!}/job.ts`)) as { job: CronJob };

logger.info({ job: program.name }, "Registering job");

job.start();

if (typeof process.send === "function") {
  logger.info("Sending ready signal");

  process.send("ready");
}

logger.info({ nextDate: job.nextDate(), job: program.name }, "Registered job");

onProcessSignals({
  signals: ["SIGINT", "SIGTERM", "SIGUSR2"],
  handler() {
    job.stop();

    logger.info({ job: program.name }, "Job stopped");
  },
  name: import.meta.url,
});
