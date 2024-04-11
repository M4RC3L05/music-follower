import type { Hono } from "hono";
import { artistsViews } from "#src/apps/admin/views/mod.ts";

export const importPage = (router: Hono) => {
  router.get("/import", (c) => {
    return c.html(artistsViews.pages.Import());
  });

  router.post("/import", async (c) => {
    await c.get("services").api.artistsService.import({
      body: c.req.raw.body!,
      signal: c.req.raw.signal,
      headers: {
        "content-length": c.req.header("content-length") ?? "",
        "content-type": c.req.header("content-type") ?? "",
      },
    });

    return c.redirect("/artists");
  });
};
