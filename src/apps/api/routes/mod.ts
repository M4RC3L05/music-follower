import { Hono } from "hono";
import { artistsRoutes } from "#src/apps/api/routes/artists/mod.ts";
import { releasesRoutes } from "#src/apps/api/routes/releases/mod.ts";

export const router = () => {
  return new Hono()
    .route("/artists", artistsRoutes())
    .route("/releases", releasesRoutes());
};
