import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";

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

    const [item] = c.get("database").sql<{ id: string }>`
      update releases
      set hidden = ${JSON.stringify(hidden)}
      where id = ${id} and type = ${type}
      returning id
    `;

    if (!item) {
      throw new HTTPException(404, { message: "Could not find release" });
    }

    return c.body(null, 204);
  });
};
