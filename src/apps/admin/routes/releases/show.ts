import type { Hono } from "hono";
import { releasesViews } from "#src/apps/admin/views/mod.ts";

export const show = (router: Hono) => {
  router.get("/:id/:type", async (c) => {
    const { id, type } = c.req.param();
    const { data: release } = await c.get("services").api.releasesService
      .getRelease({ id, type, signal: c.req.raw.signal });

    return c.html(releasesViews.pages.Show({ release }));
  });
};
