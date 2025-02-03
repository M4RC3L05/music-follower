import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/admin/app.tsx";
import config from "config";
import {
  ArtistsService,
  ReleasesService,
} from "#src/apps/admin/services/api/mod.ts";
import { makeServer } from "#src/apps/admin/server.ts";

// Add css dep to node_modules
// deno-lint-ignore ban-ts-comment
// @ts-ignore
await import("simpledotcss").catch(() => {});

const servicesConfig = config.get("apps.admin.services");

const { promise: shutdownPromise, signal: shutdownSignal } = gracefulShutdown();

await using _server = makeServer(
  makeApp({
    shutdown: shutdownSignal,
    services: {
      api: {
        artistsService: new ArtistsService(
          servicesConfig.api.url,
          servicesConfig.api.basicAuth,
          shutdownSignal,
        ),
        releasesService: new ReleasesService(
          servicesConfig.api.url,
          servicesConfig.api.basicAuth,
          shutdownSignal,
        ),
      },
    },
  }),
);

await shutdownPromise;
