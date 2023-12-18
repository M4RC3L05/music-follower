import { type Hono } from "hono";

import * as exportArtists from "./export-artists.js";
import * as getArtists from "./get-artists.js";
import * as getRemoteArtists from "./get-remote-artists.js";
import * as importArtists from "./import-artists.js";
import * as subscribeArtist from "./subscribe.js";
import * as unsubscribeArtist from "./unsubscribe.js";

export const handler = (router: Hono) => {
  getArtists.handler(router);
  getRemoteArtists.handler(router);
  subscribeArtist.handler(router);
  unsubscribeArtist.handler(router);
  exportArtists.handler(router);
  importArtists.handler(router);
};
