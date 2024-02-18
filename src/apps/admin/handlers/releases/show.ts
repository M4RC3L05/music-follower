import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { releasesViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get(
    "/releases/show",
    zValidator(
      "query",
      z.object({ id: z.string(), type: z.string() }).strict(),
      (result) => {
        if (!result.success)
          throw new RequestValidationError({
            request: { query: result.error },
          });
      },
    ),
    async (c) => {
      const { id, type } = c.req.valid("query");
      const { data: release } = await c
        .get("services")
        .api.releasesService.getRelease({
          id,
          type,
        });

      return c.html(releasesViews.pages.Show({ release }));
    },
  );
};
