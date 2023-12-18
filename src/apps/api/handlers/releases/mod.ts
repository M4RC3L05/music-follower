import { type Hono } from "hono";

import * as getReleases from "./get-releases.js";
import * as updateRelease from "./update-release.js";

export const handler = (router: Hono) => {
  getReleases.handler(router);
  updateRelease.handler(router);
};
