import { Hono } from "@hono/hono";
import { basicAuth } from "@hono/hono/basic-auth";
import config from "config";
import { index } from "#src/apps/web/routes/releases/index.tsx";
import { show } from "#src/apps/web/routes/releases/show.tsx";
import { update } from "#src/apps/web/routes/releases/update.ts";

export const releasesRoutes = () => {
  const router = new Hono();

  router.use(
    "*",
    basicAuth({
      ...config.get<{ username: string; password: string }>(
        "apps.web.basicAuth",
      ),
    }),
  );

  index(router);
  show(router);
  update(router);

  return router;
};
