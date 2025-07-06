import { Hono } from "@hono/hono";
import { basicAuth } from "@hono/hono/basic-auth";
import config from "config";
import { index } from "#src/apps/web/routes/pages/index.tsx";

export const pagesRoutes = () => {
  const router = new Hono();

  router.use(
    "/",
    basicAuth({
      ...config.get<{ name: string; pass: string }>("apps.web.basicAuth"),
    }),
  );

  index(router);

  return router;
};
