import { type ContextVariableMap, Hono } from "hono";
import type { CustomDatabase } from "#src/database/mod.ts";
import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.ts";

declare module "hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
    shutdown: AbortSignal;
  }
}

export const makeApp = (deps: Partial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", (c, next) => {
    if (deps.database) c.set("database", deps.database);
    if (deps.shutdown) c.set("shutdown", deps.shutdown);

    return next();
  });

  app.get("/", feedMiddleware);

  return app;
};
