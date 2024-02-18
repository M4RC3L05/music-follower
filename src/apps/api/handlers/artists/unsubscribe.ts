import { zValidator } from "@hono/zod-validator";
import { sql } from "@m4rc3l05/sqlite-tag";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { RequestValidationError } from "#src/errors/mod.js";

const requestParametersSchema = z
  .object({ id: z.string().regex(/^\d+$/) })
  .strict();

const handler = (router: Hono) => {
  return router.delete(
    "/:id",
    zValidator("param", requestParametersSchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { body: result.error } });
    }),
    (c) => {
      const { id } = c.req.valid("param");

      const result = c.get("database").run(sql`
        delete from artists
        where id = ${Number(id)}
      `);

      if (result.changes <= 0) {
        throw new HTTPException(404, { message: "Artists not found" });
      }

      return c.body(null, 204);
    },
  );
};

export default handler;
