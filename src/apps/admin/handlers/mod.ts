import type { Hono } from "hono";
import * as artistsHandler from "./artists/mod.js";
import * as pagesHandler from "./pages/mod.js";
import * as releasesHandler from "./releases/mod.js";

export const handler = (router: Hono) => {
  artistsHandler.handler(router);
  pagesHandler.handler(router);
  releasesHandler.handler(router);
};
