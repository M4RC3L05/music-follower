import { makeLogger } from "#src/common/logger/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import runner from "#src/apps/jobs/sync-artists-image/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";

const log = makeLogger("sync-releases");

const { done, signal: shutdownSignal } = gracefulShutdown();
await using ads = new AsyncDisposableStack();

const database = ads.use(makeDatabase());

try {
  log.info("Running sync-artists-image");

  await runner({ abort: shutdownSignal, db: database });
} catch (error) {
  log.error("Error running sync-artists-image task", { error });
} finally {
  log.info("sync-artists-image completed");
}

await done();
