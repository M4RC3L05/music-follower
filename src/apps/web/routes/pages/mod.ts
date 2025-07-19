import { Hono } from "@hono/hono";
import { basicAuth } from "@hono/hono/basic-auth";
import config from "#src/common/config/mod.ts";
import { index } from "#src/apps/web/routes/pages/index.tsx";

export const pagesRoutes = () => {
  const router = new Hono();

  router.use("/", basicAuth({ ...config.apps.web.basicAuth }));

  index(router);

  return router;
};
