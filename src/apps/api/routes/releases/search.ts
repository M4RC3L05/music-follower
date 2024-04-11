import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import vine from "@vinejs/vine";
import type { Release } from "#src/database/types/mod.ts";

const requestQuerySchema = vine
  .object({
    q: vine.string().optional(),
    hidden: vine.enum(["feed", "admin"]).optional(),
    notHidden: vine.enum(["feed", "admin"]).optional(),
    page: vine.number().parse((value) => value ?? 0),
    limit: vine.number().parse((value) => value ?? 12),
  });
const requestQueryValidator = vine.compile(requestQuerySchema);

export const search = (router: Hono) => {
  return router.get("/", async (c) => {
    const query = await requestQueryValidator.validate(c.req.query());
    const sqlQuery = sql`
        select *
        from releases
        where (
          ${
      sql.join(
        [
          sql.if(
            () => !!query.q && query.q.length > 0,
            () =>
              sql`("artistName" like ${`%${query.q}%`} or name like ${`%${query.q}%`})`,
          ),
          sql.if(
            () => !!query.hidden && query.hidden.length > 0,
            () =>
              sql`(exists (
                  select true from json_each(hidden)
                  where json_each.value is ${query.hidden}
                ))`,
          ),
          sql.if(
            () => !!query.notHidden && query.notHidden.length > 0,
            () =>
              sql`(not exists (
                  select true from json_each(hidden)
                  where json_each.value is ${query.notHidden}
                ))`,
          ),
        ],
        sql` and `,
      )
    }
        )
        order by "releasedAt" desc
      `;

    const { total } = c
      .get("database")
      .get<{ total: number }>(
        sql`select count(id) as total from (${sqlQuery})`,
      )!;

    const data = c.get("database").all<Release>(
      sql`${sqlQuery}
          limit ${query.limit}
          offset ${query.page * query.limit}`,
    );

    return c.json(
      {
        data,
        pagination: {
          previous: Math.max(query.page - 1, 0),
          next: Math.min(
            query.page + 1,
            Math.floor(total / query.limit),
          ),
          total,
          limit: query.limit,
        },
      },
      200,
    );
  });
};
