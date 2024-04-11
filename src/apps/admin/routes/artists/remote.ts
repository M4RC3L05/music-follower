import type { Hono } from "hono";
import { artistsViews } from "#src/apps/admin/views/mod.ts";

export const remote = (router: Hono) => {
  router.get("/remote", async (c) => {
    const { q } = c.req.query();
    const hasQuery = q?.trim().length > 0;

    const { data } = !hasQuery
      ? { data: [] }
      : await c.get("services").api.artistsService.searchRemote({
        q,
        signal: c.req.raw.signal,
      });

    return c.html(artistsViews.pages.Remote({ remoteArtists: data, q }));
  });

  router.post("/remote", async (c) => {
    await c.get("services").api.artistsService.subscribe({
      data: await c.req.parseBody(),
      signal: c.req.raw.signal,
    });

    return c.redirect("/artists");
  });
};
