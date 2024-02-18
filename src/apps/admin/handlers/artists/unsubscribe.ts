import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";

export const handler = (router: Hono) => {
  router.post(
    "/artists/unsubscribe",
    zValidator("form", z.object({ id: z.string() }).strict()),
    async (c) => {
      await c
        .get("services")
        .api.artistsService.unsubscribe(c.req.valid("form"));

      return c.text("ok");
    },
  );
};
