import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const requestBodySchema = vine
  .object({
    id: vine.number(),
    name: vine.string(),
    image: vine.string().url(),
  });
const requestBodyValidator = vine.compile(requestBodySchema);

export const subscribe = (router: Hono) => {
  return router.post("/", async (c) => {
    const { name, id, image } = await requestBodyValidator.validate(
      await c.req.json(),
    );

    const [inserted] = c.get("database").sql`
      insert into artists
        (id, name, "imageUrl")
      values
        (${id}, ${name}, ${image})
      returning *;
    `;

    return c.json({ data: inserted }, 201);
  });
};
