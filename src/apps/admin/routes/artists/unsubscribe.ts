import type { Hono } from "hono";

export const unsubscribe = (router: Hono) => {
  router.post("/:id/unsubscribe", async (c) => {
    const { id } = c.req.param();

    await c.get("services").api.artistsService.unsubscribe({
      id,
      signal: c.req.raw.signal,
    });

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};
