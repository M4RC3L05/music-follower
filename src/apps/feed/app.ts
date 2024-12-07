import { type ContextVariableMap, Hono } from "@hono/hono";
import config from "config";
import type { CustomDatabase } from "#src/database/mod.ts";
import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.ts";
import { serviceRegister } from "#src/middlewares/mod.ts";

declare module "@hono/hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
    shutdown: AbortSignal;
  }
}

export const makeApp = (deps: Partial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", serviceRegister(deps));

  app.get(
    "/",
    feedMiddleware({
      maxReleases: config.get<number>("apps.feed.maxReleases"),
    }),
  );

  return app;
};
