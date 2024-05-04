import type { Hono } from "hono";
import { ReleasesShowPage } from "#src/apps/admin/views/releases/pages/show.tsx";

export const show = (router: Hono) => {
  router.get("/:id/:type", async (c) => {
    const { id, type } = c.req.param();
    const { data: release } = await c.get("services").api.releasesService
      .getRelease({ id, type, signal: c.req.raw.signal });

    return c.render(<ReleasesShowPage release={release} />);
  });
};
