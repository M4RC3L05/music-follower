import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { HTTPException } from "hono/http-exception";

const requestParametersSchema = vine.object({ id: vine.number() });
const requestParametersValidator = vine.compile(requestParametersSchema);

export const unsubscribe = (router: Hono) => {
  return router.delete("/:id", async (c) => {
    const { id } = await requestParametersValidator.validate(c.req.param());

    const changes = c.get("database").execute(sql`
      delete from artists
      where id = ${id}
    `);

    if (changes <= 0) {
      throw new HTTPException(404, { message: "Artists not found" });
    }

    return c.body(null, 204);
  });
};
