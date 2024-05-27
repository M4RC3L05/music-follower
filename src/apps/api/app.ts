import config from "config";
import { Hono } from "@hono/hono";
import { basicAuth } from "@hono/hono/basic-auth";
import { cors } from "@hono/hono/cors";
import { errorMappers } from "#src/errors/mod.ts";
import { errorMapper, serviceRegister } from "#src/middlewares/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";
import type { ContextVariableMap } from "@hono/hono";
import { router } from "#src/apps/api/routes/mod.ts";

declare module "@hono/hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
    shutdown: AbortSignal;
  }
}

export const makeApp = (deps: Partial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", serviceRegister(deps));
  app.use("*", cors());
  app.use(
    "*",
    basicAuth({
      ...config.get<{ name: string; pass: string }>("apps.api.basicAuth"),
    }),
  );

  app.onError(
    errorMapper({
      defaultMapper: errorMappers.defaultErrorMapper,
    }),
  );

  return app.route("/api", router());
};
