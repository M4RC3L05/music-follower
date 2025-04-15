import { makeApp } from "#src/apps/api/app.ts";
import { makeDatabase } from "#src/database/mod.ts";
import { makeServer } from "#src/apps/api/server.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";

const { promise: shutdownPromise, signal: shutdownSignal } = gracefulShutdown();
await using ads = new AsyncDisposableStack();

const database = ads.use(makeDatabase());

ads.use(makeServer(
  makeApp({ shutdown: shutdownSignal, database: database }),
));

await shutdownPromise;
