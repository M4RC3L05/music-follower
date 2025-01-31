import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/admin/app.tsx";
import config from "config";
import {
  ArtistsService,
  ReleasesService,
} from "#src/apps/admin/services/api/mod.ts";

// Add css dep to node_modules
// deno-lint-ignore ban-ts-comment
// @ts-ignore
await import("simpledotcss").catch(() => {});

const log = makeLogger("admin");
const { host, port } = config.get("apps.admin");
const servicesConfig = config.get("apps.admin.services");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "admin",
  boot: (pl) => {
    const app = makeApp({
      shutdown: pl.signal,
      services: {
        api: {
          artistsService: new ArtistsService(
            servicesConfig.api.url,
            servicesConfig.api.basicAuth,
            pl.signal,
          ),
          releasesService: new ReleasesService(
            servicesConfig.api.url,
            servicesConfig.api.basicAuth,
            pl.signal,
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

    return server;
  },
  shutdown: (server) => server.shutdown(),
});

await processLifecycle.boot();

if (Deno.env.get("BUILD_DRY_RUN") === "true") {
  await processLifecycle.shutdown();
}
