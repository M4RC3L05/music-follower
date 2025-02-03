import { makeApp } from "#src/apps/api/app.ts";
import { makeDatabase } from "#src/database/mod.ts";
import { makeServer } from "#src/apps/api/server.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";

const { promise: shutdownPromise, signal: shutdownSignal } = gracefulShutdown();

using database = makeDatabase();
await using _server = makeServer(
  makeApp({ shutdown: shutdownSignal, database: database }),
);

await shutdownPromise;
