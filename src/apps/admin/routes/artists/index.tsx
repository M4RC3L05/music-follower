import type { Hono } from "hono";
import { ArtistsIndexPage } from "#src/apps/admin/views/artists/pages/index.tsx";

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const { limit, page, q } = c.req.query();
    const { data: artists, pagination } = await c
      .get("services")
      .api.artistsService.getArtists({
        limit: limit ? Number(limit) : undefined,
        page: page ? Number(page) : undefined,
        q,
        signal: c.req.raw.signal,
      });

    const previousLink = `/artists?page=${pagination.previous}${
      pagination.limit ? `&limit=${pagination.limit}` : ""
    }${q ? `&q=${q}` : ""}`;
    const nextLink = `/artists?page=${pagination.next}${
      pagination.limit ? `&limit=${pagination.limit}` : ""
    }${q ? `&q=${q}` : ""}`;

    return c.render(
      <ArtistsIndexPage
        artists={artists}
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
