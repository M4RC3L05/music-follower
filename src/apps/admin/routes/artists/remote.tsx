import type { Hono } from "hono";
import { ArtistsRemotePage } from "#src/apps/admin/views/artists/pages/remote.tsx";

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

    return c.render(<ArtistsRemotePage q={q} remoteArtists={data} />);
  });

  router.post("/remote", async (c) => {
    await c.get("services").api.artistsService.subscribe({
      data: await c.req.parseBody(),
      signal: c.req.raw.signal,
    });

    return c.redirect("/artists");
  });
};
