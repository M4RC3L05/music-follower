import { type Hono } from "hono";

import * as artistsHandlers from "./artists/mod.js";
import * as releasesHandlers from "./releases/mod.js";

export const handler = (router: Hono) => {
  artistsHandlers.handler(router);
  releasesHandlers.handler(router);
};
