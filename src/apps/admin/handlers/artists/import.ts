import { Readable } from "node:stream";
import type { Hono } from "hono";
import { artistsViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get("/artists/import", async (c) => {
    return c.html(artistsViews.pages.Import());
  });

  router.post("/artists/import", async (c) => {
    await c.get("services").api.artistsService.import({
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      body: Readable.fromWeb(c.req.raw.body as any),
      headers: {
        "content-length": c.req.header("content-length") ?? "",
        "content-type": c.req.header("content-type") ?? "",
      },
    });

    return c.text("ok");
  });
};
