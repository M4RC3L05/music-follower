import { makeLogger } from "#src/common/logger/mod.ts";
import { makeDatabase } from "#src/database/mod.ts";
import runner from "#src/apps/jobs/sync-releases/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";

const log = makeLogger("sync-releases");

const { done, signal: shutdownSignal } = gracefulShutdown();

using database = makeDatabase();

try {
  log.info("Running sync-releases");

  await runner({ abort: shutdownSignal, db: database });
} catch (error) {
  log.error("Error running sync-releases task", { error });
} finally {
  log.info("sync-releases completed");
}

await done();
