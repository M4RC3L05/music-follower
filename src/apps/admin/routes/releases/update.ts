import type { Hono } from "hono";

export const update = (router: Hono) => {
  router.post("/:id/:type/state", async (c) => {
    const { id, type } = c.req.param();
    const { option, state } = await c.req.parseBody();
    const { data: release } = await c.get("services").api.releasesService
      .getRelease({
        id: id,
        type: type,
        signal: c.req.raw.signal,
      });

    const finalHidden = [...JSON.parse(release.hidden)];

    if (state === "show") {
      finalHidden.push(option);
    }

    if (state === "hide") {
      finalHidden.splice(finalHidden.indexOf(option), 1);
    }

    await c.get("services").api.releasesService.updateRelease({
      id,
      type,
      hidden: [...new Set(finalHidden)],
      signal: c.req.raw.signal,
    });

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};
