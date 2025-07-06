import type { Hono } from "@hono/hono";
import { ArtistsIndexPage } from "#src/apps/web/views/artists/pages/index.tsx";
import vine from "@vinejs/vine";
import { Artist } from "#src/database/types/mod.ts";

vine.convertEmptyStringsToNull = true;
const requestQuerySchema = vine
  .object({
    q: vine.string().minLength(1).optional(),
    page: vine.number().parse((value) => value ?? 0),
    limit: vine.number().parse((value) => value ?? 12),
  });
const requestQueryValidator = vine.compile(requestQuerySchema);

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const query = await requestQueryValidator.validate(c.req.query());
    const artists = c.get("database").sql<Artist & { totalItems: number }>`
      with items as (
        select *
        from artists
        where
          iif(
            ${query.q ?? -1} = -1,
            true,
            name like '%' || ${query.q ?? -1} || '%'
          )
      )
      select *, ti."totalItems" as "totalItems"
      from
        items,
        (select count(id) as "totalItems" from items) as ti
      order by name asc
      limit ${query.limit}
      offset ${query.page * query.limit}
    `;
    const pagination = {
      previous: Math.max(query.page - 1, 0),
      next: Math.min(
        query.page + 1,
        Math.floor((artists[0]?.totalItems ?? 0) / query.limit),
      ),
      total: artists[0]?.totalItems ?? 0,
      limit: query.limit,
    };

    const sp = new URLSearchParams();

    if (pagination.limit) {
      sp.set("limit", String(pagination.limit));
    }
    if (query.q) sp.set("q", query.q);

    const previousSp = new URLSearchParams(sp);
    previousSp.set("page", String(pagination.previous));
    const nextSp = new URLSearchParams(sp);
    nextSp.set("page", String(pagination.next));
    const startSp = new URLSearchParams(sp);
    startSp.set("page", "0");
    const endSp = new URLSearchParams(sp);
    endSp.set("page", String(Math.floor(pagination.total / pagination.limit)));

    return c.render(
      <ArtistsIndexPage
        formErrors={c.get("session").get("flashFormErrors") ?? undefined}
        artists={artists}
        pagination={{
          currentUrl: c.req.url,
          startLink: `/artists?${startSp.toString()}`,
          previousLink: `/artists?${previousSp.toString()}`,
          nextLink: `/artists?${nextSp.toString()}`,
          endLink: `/artists?${endSp.toString()}`,
        }}
      />,
    );
  });
};
