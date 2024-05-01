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
  boot: (pl) => {
    const db = pl.getService<CustomDatabase>("db");
    const job = async (signal: AbortSignal) => {
      try {
        log.info("Running sync-releases");

        await runner({ abort: signal, db });
      } catch (error) {
        log.error("Error running sync-releases task", { error });
      } finally {
        log.info("sync-releases completed");

        if (!signal.aborted) {
          log.info(`Next at ${cronInstance.nextAt()}`);
        }
      }
    };
    const cronInstance = new Cron(job, {
      when: cron.pattern,
      timezone: cron.timezone,
      tickerTimeout: cron.tickerTimeout,
    });

    log.info(`Next at ${cronInstance.nextAt()}`);

    cronInstance.start();

    return cronInstance;
  },
  shutdown: (cron) => cron.stop(),
});

await processLifecycle.boot();
