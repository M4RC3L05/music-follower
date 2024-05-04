import { Hono } from "hono";
import { exportPage } from "#src/apps/admin/routes/artists/export.ts";
import { importPage } from "#src/apps/admin/routes/artists/import.tsx";
import { index } from "#src/apps/admin/routes/artists/index.tsx";
import { remote } from "#src/apps/admin/routes/artists/remote.tsx";
import { unsubscribe } from "#src/apps/admin/routes/artists/unsubscribe.ts";

export const artistsRoutes = () => {
  const router = new Hono();

  index(router);
  exportPage(router);
  importPage(router);
  remote(router);
  unsubscribe(router);

  return router;
};
