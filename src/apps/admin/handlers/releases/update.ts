import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";

export const handler = (router: Hono) => {
  router.patch(
    "/releases/state",
    zValidator(
      "form",
      z
        .object({
          id: z.string(),
          type: z.string(),
          option: z.enum(["admin", "feed"]),
          state: z.enum(["show", "hide"]),
        })
        .strict(),
      (result) => {
        if (!result.success)
          throw new RequestValidationError({
            request: { query: result.error },
          });
      },
    ),
    async (c) => {
      const { id, type, option, state } = c.req.valid("form");
      const { data: release } = await c
        .get("services")
        .api.releasesService.getRelease({
          id,
          type,
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
      });

      return c.text("ok");
    },
  );
};
