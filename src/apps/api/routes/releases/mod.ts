import { Hono } from "@hono/hono";
import { get } from "#src/apps/api/routes/releases/get.ts";
import { search } from "#src/apps/api/routes/releases/search.ts";
import { update } from "#src/apps/api/routes/releases/update.ts";

export const releasesRoutes = () => {
  const router = new Hono();

  search(router);
  get(router);
  update(router);

  return router;
};
