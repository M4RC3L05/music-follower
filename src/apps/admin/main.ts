import { HookDrain } from "#src/common/process/hook-drain.ts";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/admin/app.ts";
import config from "config";
import {
  ArtistsService,
  ReleasesService,
} from "#src/apps/admin/services/api/mod.ts";

const log = makeLogger("admin");
const { host, port } = config.get("apps.admin");
const servicesConfig = config.get("apps.admin.services");

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

const app = makeApp({
  shutdown: shutdown.signal,
  services: {
    api: {
      artistsService: new ArtistsService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
      releasesService: new ReleasesService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
    },
  },
});

const server = Deno.serve({
  hostname: host,
  port,
  onListen: ({ hostname, port }) => {
    log.info(`Serving on http://${hostname}:${port}`);
  },
}, app.fetch);

shutdown.registerHook({
  name: "admin",
  fn: async () => {
    await server.shutdown();
  },
});
