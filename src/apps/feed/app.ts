import { type Database } from "@leafac/sqlite";
import { Hono } from "hono";

import { feedMiddleware } from "./middlewares/feed-middleware.js";
import requestLifeCycle from "#src/middlewares/request-lifecycle.js";

export const makeApp = ({ database }: { database: Database }) => {
  const app = new Hono();

  app.use("*", (c, next) => {
    c.set("database", database);

    return next();
  });
  app.use("*", requestLifeCycle);
  app.use("*", feedMiddleware);

  return app;
};
