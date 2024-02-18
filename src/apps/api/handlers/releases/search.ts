import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import { type Hono } from "hono";
import { z } from "zod";
import { type Release } from "#src/database/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    q: z.string().optional(),
    hidden: z.enum(["feed", "admin"]).optional(),
    notHidden: z.enum(["feed", "admin"]).optional(),
    page: z.string().regex(/^\d+$/).optional().default("0"),
    limit: z.string().regex(/^\d+$/).optional().default("10"),
  })
  .strict();

const handler = (router: Hono) => {
  return router.get(
    "/",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const query = c.req.valid("query");
      const sqlQuery = sql`
        select *
        from releases
        where (
          ${sql.join(
            [
              sql.if(
                () => !!query.q && query.q.length > 0,
                () =>
                  sql`("artistName" like ${`%${query.q}%`} or name like ${`%${query.q}%`})`,
              ),
              sql.if(
                () => !!query.hidden && query.hidden.length > 0,
                () => sql`(exists (
                  select true from json_each(hidden)
                  where json_each.value is ${query.hidden}
                ))`,
              ),
              sql.if(
                () => !!query.notHidden && query.notHidden.length > 0,
                () => sql`(not exists (
                  select true from json_each(hidden)
                  where json_each.value is ${query.notHidden}
                ))`,
              ),
            ],
            sql` and `,
          )}
        )
        order by "releasedAt" desc
      `;

      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const { total } = c
        .get("database")
        .get<{ total: number }>(
          sql`select count(id) as total from (${sqlQuery})`,
        )!;

      const data = c.get("database").all<Release>(
        sql`${sqlQuery}
          limit ${Number(query.limit)}
          offset ${Number(query.page) * Number(query.limit)}`,
      );

      return c.json(
        {
          data,
          pagination: {
            previous: Math.max(Number(query.page) - 1, 0),
            next: Math.min(
              Number(query.page) + 1,
              Math.floor(total / Number(query.limit)),
            ),
            total,
            limit: Number(query.limit),
          },
        },
        200,
      );
    },
  );
};

export default handler;
