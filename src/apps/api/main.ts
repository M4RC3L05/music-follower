import { Cron } from "@m4rc3l05/cron";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import config from "config";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";

const log = makeLogger("api");
const { host, port } = config.get("apps.api");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => {
    // Improve performance.
    db.exec("pragma analysis_limit = 400");
    db.exec("pragma optimize");

    db.close();
  },
});

processLifecycle.registerService({
  name: "db-optimise",
  boot: (pl) => {
    const db = pl.getService<CustomDatabase>("db");
    const cronInstance = new Cron((signal) => {
      log.info("DB optimize runing");

      try {
        db.exec("pragma optimize");

        log.info("DB optimize completed");
      } catch (error) {
        log.error("DB optimize failed", { error });
      }

      if (!signal.aborted) {
        log.info(`Next db optimize at ${cronInstance.nextAt()}`);
      }
    }, {
      when: "0 * * * *",
      timezone: "UTC",
      tickerTimeout: 300,
    });

    log.info(`Next db optimize at ${cronInstance.nextAt()}`);

    cronInstance.start();

    return cronInstance;
  },
  shutdown: (cron) => cron.stop(),
});

processLifecycle.registerService({
  name: "api",
  boot: (pl) => {
    const app = makeApp({
      shutdown: pl.signal,
      database: pl.getService<CustomDatabase>("db"),
    });

    const server = Deno.serve({
      hostname: host,
      port,
      onListen: ({ hostname, port }) => {
        log.info(`Serving on http://${hostname}:${port}`);
      },
    }, app.fetch);

    return server;
  },
  shutdown: (server) => server.shutdown(),
});

await processLifecycle.boot();
