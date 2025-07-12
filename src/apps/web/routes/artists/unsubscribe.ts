import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestParamsSchema = vine.object({ id: vine.number() });
const requestParamsValidator = vine.compile(requestParamsSchema);

export const unsubscribe = (router: Hono) => {
  router.post("/:id/unsubscribe", async (c) => {
    const { id } = await requestParamsValidator.validate(c.req.param());

    const [deleted] = c.get("database").sql`
      delete from artists
      where id = ${id}
      returning id, name
    `;

    if (!deleted) {
      c.get("session").flash("flashMessages", {
        error: ["No artist found to unsubscribe"],
      });

      return c.redirect("/artists");
    }

    c.get("session").flash("flashMessages", {
      success: [`Unsubscribed to ${deleted.name} successfully`],
    });

    return c.redirect("/artists");
  });
};
