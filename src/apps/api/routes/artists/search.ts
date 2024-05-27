import { sql } from "@m4rc3l05/sqlite-tag";
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
    const limit = query.limit;
    const page = query.page;
    const sqlQuery = sql`
        select *
        from artists
        ${
      sql.if(
        () => !!query.q && query.q.length > 0,
        () => sql`where name like '%' || ${query.q} || '%'`,
      )
    }
        order by name asc
      `;

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
