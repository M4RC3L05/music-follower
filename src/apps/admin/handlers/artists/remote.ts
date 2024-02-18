import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { ItunesArtistSearchModel } from "#src/remote/mod.js";
import { artistsViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get(
    "/artists/remote",
    zValidator(
      "query",
      z.object({ q: z.string().optional() }).strict(),
      (result) => {
        if (!result.success)
          throw new RequestValidationError({
            request: { query: result.error },
          });
      },
    ),
    async (c) => {
      const { q } = c.req.valid("query");
      const { data } =
        q && q.length > 0
          ? await c.get("services").api.artistsService.searchRemote({
              query: { q },
            })
          : {
              data: [] as (ItunesArtistSearchModel & {
                image: string;
                isSubscribed: boolean;
              })[],
            };

      return c.html(artistsViews.pages.Remote({ remoteArtists: data }));
    },
  );

  router.post(
    "/artists/remote",
    zValidator(
      "form",
      z
        .object({
          id: z.string().regex(/^\d+$/),
          name: z.string(),
          image: z.string().url(),
        })
        .strict(),
    ),
    async (c) => {
      await c
        .get("services")
        .api.artistsService.subscribe({ json: c.req.valid("form") });

      return c.text("ok");
    },
  );
};
