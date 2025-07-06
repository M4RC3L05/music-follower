import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";
import { Release } from "#src/database/types/mod.ts";

const requestParametersSchema = vine
  .object({ id: vine.number(), type: vine.string() });
const requestParametersValidator = vine.compile(requestParametersSchema);

const requestBodySchema = vine
  .object({
    option: vine.enum(["feed", "admin"]),
    state: vine.enum(["show", "hide"]),
  });
const requestBodyValidator = vine.compile(requestBodySchema);

export const update = (router: Hono) => {
  router.post("/:id/:type/state", async (c) => {
    const [{ id, type }, { option, state }] = await Promise.all([
      requestParametersValidator.validate(c.req.param()),
      requestBodyValidator.validate(await c.req.parseBody()),
    ]);

    const [release] = c.get("database").sql<Pick<Release, "hidden">>`
      select hidden
      from releases
      where id = ${id} and type = ${type}
    `;

    if (!release) {
      throw new HTTPException(404, { message: "Release not found" });
    }

    const finalHidden = [...JSON.parse(release.hidden)];

    if (state === "show") {
      finalHidden.push(option);
    }

    if (state === "hide") {
      finalHidden.splice(finalHidden.indexOf(option), 1);
    }

    const [updated] = c.get("database").sql<{ id: string }>`
      update releases
      set hidden = ${JSON.stringify([...new Set(finalHidden)])}
      where id = ${id} and type = ${type}
      returning id
    `;

    if (!updated) {
      throw new HTTPException(404, { message: "Release not found" });
    }

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};
