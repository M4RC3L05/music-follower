import { Hono } from "@hono/hono";
import { exportPage } from "#src/apps/web/routes/artists/export.ts";
import { importPage } from "#src/apps/web/routes/artists/import.tsx";
import { index } from "#src/apps/web/routes/artists/index.tsx";
import { remote } from "#src/apps/web/routes/artists/remote.tsx";
import { unsubscribe } from "#src/apps/web/routes/artists/unsubscribe.ts";
import { authMiddleware } from "#src/middlewares/mod.ts";

export const artistsRoutes = () => {
  const router = new Hono();

  router.use("*", authMiddleware);

  index(router);
  exportPage(router);
  importPage(router);
  remote(router);
  unsubscribe(router);

  return router;
};
