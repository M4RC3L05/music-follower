import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { z } from "zod";
import { type Release } from "#src/database/mod.js";
import { RequestValidationError } from "#src/errors/mod.js";

const requestQuerySchema = z
  .object({
    id: z.string(),
    type: z.string(),
  })
  .strict();

const handler = (router: Hono) => {
  return router.get(
    "/:id/:type",
    zValidator("param", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { query: result.error } });
    }),
    (c) => {
      const { id, type } = c.req.valid("param");
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const data = c.get("database").get<Release>(sql`
        select *
        from releases
        where id = ${id} and type = ${type}
      `)!;

      return c.json({ data }, 200);
    },
  );
};

export default handler;
