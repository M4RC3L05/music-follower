import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import { type Hono } from "hono";
import { z } from "zod";
import { type Artist } from "#src/database/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    q: z.string().optional(),
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
      const limit = Number(query.limit ?? 12);
      const page = Number(query.page ?? 0);
      const sqlQuery = sql`
        select *
        from artists
        ${sql.if(
          () => !!query.q && query.q.length > 0,
          () => sql`where name like '%' || ${query.q} || '%'`,
        )}
        order by name asc
      `;

      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const { total } = c
        .get("database")
        .get<{ total: number }>(
          sql`select count(id) as total from (${sqlQuery})`,
        )!;

      const data = c
        .get("database")
        .all<Artist>(sql`${sqlQuery} limit ${limit} offset ${page * limit}`);

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
