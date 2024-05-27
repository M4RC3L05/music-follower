import type { Hono } from "@hono/hono";
import { ReleasesIndexPage } from "#src/apps/admin/views/releases/pages/index.tsx";

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const { hidden, limit, page, q } = c.req.query();
    const { data: releases, pagination } = await c
      .get("services")
      .api.releasesService.getReleases({
        hidden: hidden === "" ? undefined : hidden,
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
        q,
        notHidden: !hidden || hidden.length <= 0 ? "admin" : undefined,
        signal: c.req.raw.signal,
      });

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
