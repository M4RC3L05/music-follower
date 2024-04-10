import { Hono } from "hono";
import { exportArtists } from "#src/apps/api/routes/artists/export.ts";
import { importArtists } from "#src/apps/api/routes/artists/import.ts";
import { searchRemote } from "#src/apps/api/routes/artists/search-remote.ts";
import { search } from "#src/apps/api/routes/artists/search.ts";
import { subscribe } from "#src/apps/api/routes/artists/subscribe.ts";
import { unsubscribe } from "#src/apps/api/routes/artists/unsubscribe.ts";

export const artistsRoutes = () => {
  const router = new Hono();

  exportArtists(router);
  searchRemote(router);
  search(router);
  importArtists(router);
  subscribe(router);
  unsubscribe(router);

  return router;
};
