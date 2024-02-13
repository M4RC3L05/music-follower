import { Hono } from "hono";
import * as artistsRouter from "./artists/mod.js";
import * as releasesRouter from "./releases/mod.js";

export const handlersRouter = () => {
  return new Hono()
    .route("/artists", artistsRouter.router())
    .route("/releases", releasesRouter.router());
};
