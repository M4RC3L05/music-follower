import type { Hono } from "@hono/hono";
import { ReleasesShowPage } from "#src/apps/web/views/releases/pages/show.tsx";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";
import type { Release } from "#src/database/types/mod.ts";

const requestParametersSchema = vine.object({
  id: vine.number(),
  type: vine.string(),
});
const requestParametersValidator = vine.compile(requestParametersSchema);

export const show = (router: Hono) => {
  router.get("/:id/:type", async (c) => {
    const { id, type } = await requestParametersValidator.validate(
      c.req.param(),
    );
    const [release] = c.get("database").sql<Release>`
      select *
      from releases
      where id = ${id} and type = ${type}
    `;

    if (!release) {
      throw new HTTPException(404, { message: "Release not found" });
    }

    return c.render(<ReleasesShowPage release={release} />);
  });
};
