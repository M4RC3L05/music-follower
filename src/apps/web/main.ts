import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
import { makeServer } from "#src/apps/web/server.ts";
import { makeDatabase } from "../../database/mod.ts";
import { MemoryStore } from "@jcs224/hono-sessions";

await import("bootstrap").catch(() => {});
await import("bootstrap-icons").catch(() => {});

const { promise: shutdownPromise, signal: shutdownSignal } = gracefulShutdown();

using database = makeDatabase();

await using _server = makeServer(
  makeApp({
    database,
    shutdown: shutdownSignal,
    sessioStore: new MemoryStore(),
  }),
);

await shutdownPromise;
