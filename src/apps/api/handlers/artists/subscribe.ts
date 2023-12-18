import { type Hono } from "hono";
import sql from "@leafac/sqlite";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { RequestValidationError } from "#src/errors/mod.js";

const requestBodySchema = z
  .object({ id: z.string().regex(/^\d+$/), name: z.string(), image: z.string().url() })
  .strict();

export const handler = (router: Hono) => {
  router.post(
    "/api/artists",
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success) throw new RequestValidationError({ request: { body: result.error } });
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
