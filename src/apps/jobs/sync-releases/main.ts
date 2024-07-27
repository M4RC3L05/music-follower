import { makeLogger } from "#src/common/logger/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import runner from "#src/apps/jobs/sync-releases/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { delay } from "@std/async";

const log = makeLogger("sync-releases");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => db.close(),
});

processLifecycle.registerService({
  name: "job",
  boot: (pc) => {
    const db = pc.getService<CustomDatabase>("db");
    const ac = new AbortController();
    const job = async () => {
      try {
        log.info("Running sync-releases");

        await runner({ abort: ac.signal, db });
      } catch (error) {
        log.error("Error running sync-releases task", { error });
      } finally {
        log.info("sync-releases completed");
      }
    };

    return {
      job: delay(0, { signal: ac.signal }).then(() => job(), (error) => {
        log.warn("Something stopped deferred delay", { error });
      }),
      ac,
    };
  },
  shutdown: async ({ ac, job }) => {
    if (!ac.signal.aborted) {
      ac.abort();
    }

    await Promise.allSettled([job]);
  },
});

await processLifecycle.boot();
