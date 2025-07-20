import { Hono } from "@hono/hono";
import { index } from "#src/apps/web/routes/releases/index.tsx";
import { show } from "#src/apps/web/routes/releases/show.tsx";
import { update } from "#src/apps/web/routes/releases/update.ts";
import { authMiddleware } from "#src/middlewares/mod.ts";

export const releasesRoutes = () => {
  const router = new Hono();

  router.use("*", authMiddleware);

  index(router);
  show(router);
  update(router);

  return router;
};
