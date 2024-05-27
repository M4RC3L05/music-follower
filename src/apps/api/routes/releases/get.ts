import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import type { Release } from "#src/database/types/mod.ts";
import { HTTPException } from "@hono/hono/http-exception";

const requestParametersSchema = vine.object({
  id: vine.number(),
  type: vine.string(),
});
const requestParametersValidator = vine.compile(requestParametersSchema);

export const get = (router: Hono) => {
  return router.get("/:id/:type", async (c) => {
    const { id, type } = await requestParametersValidator.validate(
      c.req.param(),
    );

    const release = c.get("database").get<Release>(sql`
        select *
        from releases
        where id = ${id} and type = ${type}
      `);

    if (!release) {
      throw new HTTPException(404, { message: "Could not find feed" });
    }

    return c.json({ data: release }, 200);
  });
};
