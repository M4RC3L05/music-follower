import process from "node:process";
import { createAdaptorServer } from "@hono/node-server";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.js";
import { makeDatabase } from "#src/database/mod.js";
import { ShutdownManager } from "#src/managers/mod.js";
import { makeApp } from "./app.js";

const shutdownManager = new ShutdownManager();

const { port, host } = config.get<{ port: number; host: string }>("apps.feed");
const log = makeLogger("api");

const database = makeDatabase();

shutdownManager.addHook("database", () => {
  database.close();
});

const app = makeApp({ database });
const server = createAdaptorServer(app);

server.listen({ port, hostname: host }, () => {
  log.info(`Listening on ${host}:${port}`);

  if (typeof process.send === "function") {
    log.info("Sending ready signal");

    process.send("ready");
  }
});

shutdownManager.addHook("feed", async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});
