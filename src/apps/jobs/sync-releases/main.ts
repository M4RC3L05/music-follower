import { Cron } from "@m4rc3l05/cron";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import runner from "#src/apps/jobs/sync-releases/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.jobs.sync-releases");
const log = makeLogger("sync-releases");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => db.close(),
});

processLifecycle.registerService({
  name: "sync-releases-job",
  boot: () => new Cron(cron.pattern, cron.timezone, cron.tickerTimeout),
  shutdown: (cron) => cron.stop(),
});

await processLifecycle.boot();

const cronJob = processLifecycle.getService<Cron>("sync-releases-job");
const db = processLifecycle.getService<CustomDatabase>("db");

log.info("Registered sync-releases", { nextAt: cronJob.nextAt() });

for await (const signal of cronJob.start()) {
  try {
    log.info("Running sync-releases");

    await runner({ abort: signal, db });
  } catch (error) {
    log.error("Error running sync-releases task", { error });
  } finally {
    log.info("sync-releases completed");
    log.info(`Next at ${cronJob.nextAt()}`);
  }
}
