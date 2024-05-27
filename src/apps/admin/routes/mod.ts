import { Hono } from "@hono/hono";
import { artistsRoutes } from "#src/apps/admin/routes/artists/mod.ts";
import { pagesRoutes } from "#src/apps/admin/routes/pages/mod.ts";
import { releasesRoutes } from "#src/apps/admin/routes/releases/mod.ts";

export const router = () => {
  return new Hono()
    .route("/", pagesRoutes())
    .route("/artists", artistsRoutes())
    .route("/releases", releasesRoutes());
};
