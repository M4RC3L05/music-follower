import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { z } from "zod";

import { type Artist } from "#src/database/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    q: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  })
  .strict();

export const handler = (router: Hono) => {
  router.get(
    "/api/artists",
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
        where
          ${query.q} is null or
          name like ${`%${query.q}%`}
        order by name asc
      `;

      const size = c
        .get("database")
        .get<{ total: number }>(
          sql`select count(id) as total from ($${sqlQuery})`,
        );

      if (!size) throw new Error("Could not get total number of artists");

      const data = c
        .get("database")
        .all<Artist>(sql`$${sqlQuery} limit ${limit} offset ${page * limit}`);

      return c.json(
        { data, pagination: { total: size.total, page, limit } },
        200,
      );
    },
  );
};
