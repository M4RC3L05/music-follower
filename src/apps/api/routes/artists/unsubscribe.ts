import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";

const requestParametersSchema = vine.object({ id: vine.number() });
const requestParametersValidator = vine.compile(requestParametersSchema);

export const unsubscribe = (router: Hono) => {
  return router.delete("/:id", async (c) => {
    const { id } = await requestParametersValidator.validate(c.req.param());

    const [item] = c.get("database").sql`
      delete from artists
      where id = ${id}
      returning id
    `;

    if (!item) {
      throw new HTTPException(404, { message: "Artists not found" });
    }

    return c.body(null, 204);
  });
};
