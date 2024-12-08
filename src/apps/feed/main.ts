import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/feed/app.ts";
import config from "config";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";

const log = makeLogger("feed");
const { host, port } = config.get("apps.feed");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => db.close(),
});

processLifecycle.registerService({
  name: "feed",
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

if (Deno.env.get("BUILD_DRY_RUN") === "true") {
  await processLifecycle.shutdown();
}
