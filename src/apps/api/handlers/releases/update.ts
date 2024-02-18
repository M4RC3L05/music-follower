import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import { type Hono } from "hono";
import { z } from "zod";

import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z
  .object({ id: z.string().regex(/^\d+$/), type: z.string() })
  .strict();
const requestBodySchema = z
  .object({ hidden: z.array(z.enum(["feed", "admin"])) })
  .strict();

const handler = (router: Hono) => {
  return router.patch(
    "/:id/:type",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { params: result.error } });
    }),
    zValidator("json", requestBodySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const { id, type } = c.req.valid("param");
      const { hidden } = c.req.valid("json");

      console.log("hidden", hidden);

      c.get("database").execute(sql`
        update releases
        set hidden = ${JSON.stringify(hidden)}
        where id = ${Number(id)} and type = ${type}
        returning *
      `);

      return c.body(null, 204);
    },
  );
};

export default handler;
