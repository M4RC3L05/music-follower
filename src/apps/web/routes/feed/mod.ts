import { Hono } from "@hono/hono";
import { index } from "#src/apps/web/routes/feed/index.ts";

export const feedRoutes = () => {
  const router = new Hono();

  index(router);

  return router;
};
