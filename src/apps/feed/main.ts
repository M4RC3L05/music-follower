import { HookDrain } from "#src/common/process/hook-drain.ts";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/feed/app.ts";
import config from "config";
import { makeDatabase } from "#src/database/mod.ts";

const log = makeLogger("feed");
const { host, port } = config.get("apps.feed");

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
const app = makeApp({
  shutdown: shutdown.signal,
  database: db,
});

const server = Deno.serve({
  hostname: host,
  port,
  onListen: ({ hostname, port }) => {
    log.info(`Serving on http://${hostname}:${port}`);
  },
}, app.fetch);

shutdown.registerHook({
  name: "feed",
  fn: async () => {
    await server.shutdown();
  },
});

shutdown.registerHook({
  name: "db",
  fn: () => {
    db.close();
  },
});
