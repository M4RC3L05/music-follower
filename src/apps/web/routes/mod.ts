import { Hono } from "@hono/hono";
import { artistsRoutes } from "#src/apps/web/routes/artists/mod.ts";
import { pagesRoutes } from "#src/apps/web/routes/pages/mod.ts";
import { releasesRoutes } from "#src/apps/web/routes/releases/mod.ts";
import { feedRoutes } from "#src/apps/web/routes/feed/mod.ts";

export const router = () => {
  return new Hono()
    .route("/", pagesRoutes())
    .route("/feed", feedRoutes())
    .route("/artists", artistsRoutes())
    .route("/releases", releasesRoutes());
};
