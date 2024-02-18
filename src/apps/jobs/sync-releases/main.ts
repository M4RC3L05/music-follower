import { ShutdownManager } from "@m4rc3l05/shutdown-manager";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.js";
import { Cron } from "#src/common/utils/cron-utils.js";
import { makeDatabase } from "#src/database/mod.js";
import runner from "./app.js";

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

log.info({ nextAt: job.nextAt() }, "Registered sync-releases");

for await (const signal of job.start()) {
  try {
    log.info("Running sync-releases");

    await runner({ abort: signal, db });
  } catch (error) {
    log.error(error, "Error running sync-releases task");
  } finally {
    log.info("sync-releases completed");
    log.info(`Next at ${job.nextAt()}`);
  }
}
