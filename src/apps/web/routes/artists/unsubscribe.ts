import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";

const requestParamsSchema = vine.object({ id: vine.number() });
const requestParamsValidator = vine.compile(requestParamsSchema);

export const unsubscribe = (router: Hono) => {
  router.post("/:id/unsubscribe", async (c) => {
    const { id } = await requestParamsValidator.validate(c.req.param());

    const [deleted] = c.get("database").sql`
      delete from artists
      where id = ${id}
      returning id
    `;

    if (!deleted) {
      throw new HTTPException(400, {
        message: "Could not unsubscribe from artist",
      });
    }

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};
