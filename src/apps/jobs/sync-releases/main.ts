import { makeLogger } from "#src/common/logger/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import runner from "#src/apps/jobs/sync-releases/app.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";

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
    const job = async () => {
      if (Deno.env.get("BUILD_DRY_RUN") === "true") return;

      try {
        log.info("Running sync-releases");

        await runner({ abort: pc.signal, db });
      } catch (error) {
        log.error("Error running sync-releases task", { error });
      } finally {
        log.info("sync-releases completed");
      }
    };

    return { job: job() };
  },
  shutdown: ({ job }) => job,
});

await processLifecycle.boot();

if (Deno.env.get("BUILD_DRY_RUN") === "true") {
  await processLifecycle.shutdown();
}
