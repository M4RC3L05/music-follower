import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { RequestValidationError } from "#src/errors/mod.js";
import { utils } from "../../views/common/mod.js";
import { releasesViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get(
    "/releases",
    zValidator(
      "query",
      z
        .object({
          q: z.string().optional(),
          hidden: z.enum(["feed", "admin", ""]).optional(),
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
      const { hidden, limit, page, q } = c.req.valid("query");
      const { data: releases, pagination } = await c
        .get("services")
        .api.releasesService.getReleases({
          query: {
            hidden: hidden === "" ? undefined : hidden,
            limit,
            page,
            q,
            notHidden: !hidden || hidden.length <= 0 ? "admin" : undefined,
          },
        });

      const previousLink = `/releases?page=${pagination.previous}${
        pagination.limit ? `&limit=${pagination.limit}` : ""
      }${q ? `&q=${q}` : ""}${hidden ? `&hidden=${hidden}` : ""}`;
      const nextLink = `/releases?page=${pagination.next}${
        pagination.limit ? `&limit=${pagination.limit}` : ""
      }${q ? `&q=${q}` : ""}${hidden ? `&hidden=${hidden}` : ""}`;

      return c.html(
        releasesViews.pages.Index({
          releases,
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
