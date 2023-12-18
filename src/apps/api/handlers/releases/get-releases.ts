import { type Hono } from "hono";
import sql from "@leafac/sqlite";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { type Release } from "#src/database/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    q: z.string().optional(),
    hidden: z.enum(["feed", "admin"]).optional(),
    notHidden: z.enum(["feed", "admin"]).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/releases",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const query = c.req.valid("query");
      const limit = Number(query.limit ?? 12);
      const page = Number(query.page ?? 0);
      const sqlQuery = sql`
        select *
        from releases
        where (
          (
            ${query.q} is null or
            "artistName" like ${`%${query.q}%`} or
            name like ${`%${query.q}%`}
          )
          and
          (
            ${query.hidden} is null or
            exists (
              select true from json_each(hidden)
              where json_each.value is ${query.hidden}
            )
          )
          and
          (
            ${query.notHidden} is null or
            not exists (
              select true from json_each(hidden)
              where json_each.value is ${query.notHidden}
            )
          )
        )
        order by "releasedAt" desc
      `;

      const { total } = c.get("database").get<{ total: number }>(sql`select count(id) as total from ($${sqlQuery})`)!;
      const data = c.get("database").all<Release>(sql`$${sqlQuery} limit ${limit} offset ${page * limit}`);

      return c.json({ data, pagination: { total, page, limit } }, 200);
    },
  );
};
