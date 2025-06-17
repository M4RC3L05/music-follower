import type { Hono } from "@hono/hono";
import { ReleasesIndexPage } from "#src/apps/admin/views/releases/pages/index.tsx";
import type { ReleasesService } from "#src/apps/admin/services/api/mod.ts";

const resolveGetReleasesArgs = (
  data: Record<string, string | AbortSignal | undefined>,
) => {
  const result: Parameters<ReleasesService["getReleases"]>[0] = {
    signal: data.signal as AbortSignal,
  };

  if (data.hidden) result.hidden = data.hidden as string;
  if (data.limit) result.limit = Number(data.limit);
  if (data.page) result.page = Number(data.page);
  if (data.q) result.q = data.q as string;
  if (data.notHidden) result.notHidden = data.notHidden as string;

  return result;
};

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const { hidden, limit, page, q } = c.req.query();
    const { data: releases, pagination } = await c
      .get("services")
      .api
      .releasesService.getReleases(
        resolveGetReleasesArgs({
          hidden: hidden === "" ? undefined : hidden,
          limit,
          page,
          q,
          notHidden: !hidden || hidden.length <= 0 ? "admin" : undefined,
          signal: c.req.raw.signal,
        }),
      );

    const previousLink = `/releases?page=${pagination.previous}${
      pagination.limit ? `&limit=${pagination.limit}` : ""
    }${q ? `&q=${q}` : ""}${hidden ? `&hidden=${hidden}` : ""}`;
    const nextLink = `/releases?page=${pagination.next}${
      pagination.limit ? `&limit=${pagination.limit}` : ""
    }${q ? `&q=${q}` : ""}${hidden ? `&hidden=${hidden}` : ""}`;

    return c.render(
      <ReleasesIndexPage
        releases={releases}
        pagination={{
          currentUrl: c.req.url,
          startLink: previousLink.replace(/\?page=[0-9]+/, "?page=0"),
          previousLink: previousLink,
          nextLink: nextLink,
          endLink: previousLink.replace(
            /\?page=[0-9]+/,
            `?page=${Math.floor(pagination.total / pagination.limit)}`,
          ),
        }}
      />,
    );
  });
};
