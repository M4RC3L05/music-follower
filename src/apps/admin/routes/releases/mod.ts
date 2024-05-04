import { Hono } from "hono";
import { index } from "#src/apps/admin/routes/releases/index.tsx";
import { show } from "#src/apps/admin/routes/releases/show.tsx";
import { update } from "#src/apps/admin/routes/releases/update.ts";

export const releasesRoutes = () => {
  const router = new Hono();

  index(router);
  show(router);
  update(router);

  return router;
};
