import { Cron } from "@m4rc3l05/cron";
import { ShutdownManager } from "@m4rc3l05/shutdown-manager";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import runner from "./app.ts";

const { cron } = config.get<{
  cron: { pattern: string; tickerTimeout?: number; timezone: string };
}>("apps.jobs.sync-releases");
const log = makeLogger("sync-releases");

const shutdownManager = new ShutdownManager({ log });
const db = makeDatabase();

shutdownManager.addHook("database", () => {
  db.close();
});

const job = new Cron(cron.pattern, cron.timezone, cron.tickerTimeout);

shutdownManager.addHook("sync-releases", async () => {
  await job.stop();
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
