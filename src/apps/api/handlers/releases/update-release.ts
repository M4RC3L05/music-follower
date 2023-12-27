import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { z } from "zod";

import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z
  .object({ id: z.string().regex(/^\d+$/) })
  .strict();
const requestBodySchema = z
  .object({ hidden: z.array(z.enum(["feed", "admin"])) })
  .strict();

export const handler = (router: Hono) => {
  router.patch(
    "/api/releases/:id",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { params: result.error } });
    }),
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const { id } = c.req.valid("param");
      const { hidden } = c.req.valid("json");

      c.get("database").execute(sql`
        update releases
        set hidden = ${JSON.stringify(hidden)}
        where id = ${Number(id)}
        returning *
      `);

      return c.body(null, 204);
    },
  );
};
