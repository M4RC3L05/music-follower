import { type Database } from "@leafac/sqlite";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import config from "config";
import { cors } from "hono/cors";

import { errorMapper, requestLifeCycle } from "#src/middlewares/mod.js";
import { errorMappers } from "#src/errors/mod.js";
import { router } from "./router.js";

export const makeApp = ({ database }: { database: Database }) => {
  const app = new Hono();

  app.use("*", (c, next) => {
    c.set("database", database);

    return next();
  });
  app.use("*", requestLifeCycle);
  app.use("*", cors());
  app.use(
    "*",
    basicAuth({
      username: config.get<{ name: string; pass: string }>("apps.api.basicAuth").name,
      password: config.get<{ name: string; pass: string }>("apps.api.basicAuth").pass,
    }),
  );

  app.onError(
    errorMapper({
      mappers: [errorMappers.validationErrorMapper],
      defaultMapper: errorMappers.defaultErrorMapper,
    }),
  );

  router(app);

  return app;
};
