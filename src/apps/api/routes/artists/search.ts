import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import type { Artist } from "#src/database/types/mod.ts";

const requestQuerySchema = vine
  .object({
    q: vine.string().optional(),
    page: vine.number().parse((value) => value ?? 0),
    limit: vine.number().parse((value) => value ?? 12),
  });
const requestQueryValidator = vine.compile(requestQuerySchema);

export const search = (router: Hono) => {
  return router.get("/", async (c) => {
    const query = await requestQueryValidator.validate(c.req.query());

    const data = c.get("database").sql<Artist & { totalItems: number }>`
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

    return c.json(
      {
        data,
        pagination: {
          previous: Math.max(query.page - 1, 0),
          next: Math.min(
            query.page + 1,
            Math.floor((data[0]?.totalItems ?? 0) / query.limit),
          ),
          total: data[0]?.totalItems ?? 0,
          limit: query.limit,
        },
      },
      200,
    );
  });
};
