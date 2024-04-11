import { Cron } from "@m4rc3l05/cron";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import runner from "#src/apps/jobs/sync-releases/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { HookDrain } from "#src/common/process/hook-drain.ts";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.jobs.sync-releases");
const log = makeLogger("sync-releases");

const shutdown = new HookDrain({
  log,
  onFinishDrain: (error) => {
    log.info("Exiting application");

    if (error.error) {
      if (error.reason === "timeout") {
        log.warn("Global shutdown timeout exceeded");
      }

      Deno.exit(1);
    } else {
      Deno.exit(0);
    }
  },
});

gracefulShutdown({ hookDrain: shutdown, log });

const db = makeDatabase();

const job = new Cron(cron.pattern, cron.timezone, cron.tickerTimeout);

shutdown.registerHook({
  name: "sync-releases",
  fn: async () => {
    await job.stop();
  },
});

shutdown.registerHook({
  name: "database",
  fn: () => {
    db.close();
  },
});

log.info("Registered sync-releases", { nextAt: job.nextAt() });

for await (const signal of job.start()) {
  try {
    log.info("Running sync-releases");

    await runner({ abort: signal, db });
  } catch (error) {
    log.error("Error running sync-releases task", { error });
  } finally {
    log.info("sync-releases completed");
    log.info(`Next at ${job.nextAt()}`);
  }
}
