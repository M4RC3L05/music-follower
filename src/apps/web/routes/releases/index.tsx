import type { Hono } from "@hono/hono";
import { ReleasesIndexPage } from "#src/apps/web/views/releases/pages/index.tsx";
import vine from "@vinejs/vine";
import type { Release } from "#src/database/types/mod.ts";

vine.convertEmptyStringsToNull = true;
const requestQuerySchema = vine
  .object({
    q: vine.string().minLength(1).optional(),
    hidden: vine.enum(["feed", "admin", "none"]).optional(),
    page: vine.number().parse((value) => value ?? 0),
    limit: vine.number().parse((value) => value ?? 12),
  });
const requestQueryValidator = vine.compile(requestQuerySchema);

export const index = (router: Hono) => {
  router.get("/", async (c) => {
    const query = await requestQueryValidator.validate(c.req.query());
    const notHidden = !query.hidden || query.hidden === "none"
      ? "admin"
      : "none";
    const releases = c.get("database").sql<Release & { totalItems: number }>`
      with items as (
        select *
        from releases
        where
          iif(
            ${query.q ?? -1} = -1,
            true,
                "artistName" like ${`%${query.q ?? -1}%`}
            or name like ${`%${query.q ?? -1}%`}
          )
          and
          iif(
            ${query.hidden ?? "none"} = 'none',
            true,
            exists (
              select true from json_each(hidden)
              where json_each.value is ${query.hidden ?? "none"}
            )
          )
          and
          iif(
            ${notHidden} = 'none',
            true,
            not exists (
              select true from json_each(hidden)
              where json_each.value is ${notHidden}
            )
          )
      )
      select *, ti."totalItems" as "totalItems"
      from
        items,
        (select count(id) as "totalItems" from items) as ti
      order by "releasedAt" desc
      limit ${query.limit}
      offset ${query.page * query.limit}
    `;
    const pagination = {
      previous: Math.max(query.page - 1, 0),
      next: Math.min(
        query.page + 1,
        Math.floor((releases[0]?.totalItems ?? 0) / query.limit),
      ),
      total: releases[0]?.totalItems ?? 0,
      limit: query.limit,
    };
    const sp = new URLSearchParams();

    if (pagination.limit) {
      sp.set("limit", String(pagination.limit));
    }
    if (query.q) sp.set("q", query.q);
    if (query.hidden) sp.set("hidden", query.hidden);

    const previousSp = new URLSearchParams(sp);
    previousSp.set("page", String(pagination.previous));
    const nextSp = new URLSearchParams(sp);
    nextSp.set("page", String(pagination.next));
    const startSp = new URLSearchParams(sp);
    startSp.set("page", "0");
    const endSp = new URLSearchParams(sp);
    endSp.set("page", String(Math.floor(pagination.total / pagination.limit)));

    return c.render(
      <ReleasesIndexPage
        formErrors={c.get("session").get("flashFormErrors") ?? undefined}
        releases={releases}
        pagination={{
          currentUrl: c.req.url,
          startLink: `/releases?${startSp.toString()}`,
          previousLink: `/releases?${previousSp.toString()}`,
          nextLink: `/releases?${nextSp.toString()}`,
          endLink: `/releases?${endSp.toString()}`,
        }}
      />,
    );
  });
};
