import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestParametersSchema = vine
  .object({ id: vine.number(), type: vine.string() });
const requestParametersValidator = vine.compile(requestParametersSchema);

const requestBodySchema = vine
  .object({ hidden: vine.array(vine.enum(["feed", "admin"])) });
const requestBodyValidator = vine.compile(requestBodySchema);

export const update = (router: Hono) => {
  return router.patch("/:id/:type", async (c) => {
    const [{ id, type }, { hidden }] = await Promise.all([
      requestParametersValidator.validate(c.req.param()),
      requestBodyValidator.validate(await c.req.json()),
    ]);

    c.get("database").execute(sql`
      update releases
      set hidden = ${JSON.stringify(hidden)}
      where id = ${id} and type = ${type}
      returning *
    `);

    return c.body(null, 204);
  });
};
