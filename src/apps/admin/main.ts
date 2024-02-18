import process from "node:process";
import { createAdaptorServer } from "@hono/node-server";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.js";
import { ShutdownManager } from "#src/managers/mod.js";
import { makeApp } from "./app.js";
import { ArtistsService, ReleasesService } from "./services/api/mod.js";

const shutdownManager = new ShutdownManager();

const { port, host } = config.get<{ port: number; host: string }>("apps.admin");
const log = makeLogger("admin");

const app = makeApp({
  services: {
    api: {
      artistsService: new ArtistsService(),
      releasesService: new ReleasesService(),
    },
  },
});
const server = createAdaptorServer(app);

server.listen({ port, hostname: host }, () => {
  log.info(`Listening on ${host}:${port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

shutdownManager.addHook("admin", async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});
