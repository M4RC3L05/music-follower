import { Hono } from "hono";
import { artistsRoutes } from "./artists/mod.ts";
import { pagesRoutes } from "./pages/mod.ts";
import { releasesRoutes } from "./releases/mod.ts";

export const router = () => {
  return new Hono()
    .route("/", pagesRoutes())
    .route("/artists", artistsRoutes())
    .route("/releases", releasesRoutes());
};
