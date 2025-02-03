import type { Hono } from "@hono/hono";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";

const log = makeLogger("server");
const { host, port } = config.get("apps.api");

class Server {
  #server: Deno.HttpServer;

  constructor(app: Hono) {
    log.info("Creating server");

    this.#server = Deno.serve({
      hostname: host,
      port,
      onListen: ({ hostname, port }) => {
        log.info(`Serving on http://${hostname}:${port}`);
        log.info("Server created successfully");
      },
    }, app.fetch);
  }

  async [Symbol.asyncDispose]() {
    log.info("Closing server");

    await this.#server.shutdown();

    log.info("Server closed successfully");
  }
}

export const makeServer = (app: Hono) => {
  return new Server(app);
};
