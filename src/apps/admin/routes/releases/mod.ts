import { Hono } from "hono";
import { index } from "#src/apps/admin/routes/releases/index.ts";
import { show } from "#src/apps/admin/routes/releases/show.ts";
import { update } from "#src/apps/admin/routes/releases/update.ts";

export const releasesRoutes = () => {
  const router = new Hono();

  index(router);
  show(router);
  update(router);

  return router;
};