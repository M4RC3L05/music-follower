import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { z } from "zod";

import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z
  .object({
    id: z.string().regex(/^\d+$/),
    name: z.string(),
    image: z.string().url(),
  })
  .strict();

const handler = (router: Hono) => {
  return router.post(
    "/",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const { name, id, image } = c.req.valid("json");

      const inserted = c.get("database").get(sql`
        insert into artists
          (id, name, "imageUrl")
        values
          (${Number(id)}, ${name}, ${image})
        returning *;
      `);

      return c.json({ data: inserted }, 201);
    },
  );
};

export default handler;
