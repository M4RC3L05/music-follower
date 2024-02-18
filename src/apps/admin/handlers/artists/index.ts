import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { utils } from "../../views/common/mod.js";
import { artistsViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get(
    "/artists",
    zValidator(
      "query",
      z
        .object({
          q: z.string().optional(),
          page: z.string().regex(/^\d+$/).optional(),
          limit: z.string().regex(/^\d+$/).optional(),
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
      const { limit, page, q } = c.req.valid("query");
      const { data: artists, pagination } = await c
        .get("services")
        .api.artistsService.getArtists({
          query: { limit, page, q },
        });

      const previousLink = `/artists?page=${pagination.previous}${
        pagination.limit ? `&limit=${pagination.limit}` : ""
      }${q ? `&q=${q}` : ""}`;
      const nextLink = `/artists?page=${pagination.next}${
        pagination.limit ? `&limit=${pagination.limit}` : ""
      }${q ? `&q=${q}` : ""}`;

      return c.html(
        artistsViews.pages.Index({
          artists,
          pagination: {
            currentUrl: c.req.url,
            startLink: utils.replaceAndReloadLink(
              previousLink.replace(/\?page=[0-9]+/, "?page=0"),
            ),
            previousLink: utils.replaceAndReloadLink(previousLink),
            nextLink: utils.replaceAndReloadLink(nextLink),
            endLink: utils.replaceAndReloadLink(
              previousLink.replace(
                /\?page=[0-9]+/,
                `?page=${Math.floor(pagination.total / pagination.limit)}`,
              ),
            ),
          },
        }),
      );
    },
  );
};
