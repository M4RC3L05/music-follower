import type { Hono } from "@hono/hono";
import { AuthRegisterPage } from "#src/apps/web/views/auth/pages/register.tsx";
import vine from "@vinejs/vine";
import { hash } from "#src/common/crypto/mod.ts";

const requestBodySchema = vine
  .object({
    username: vine.string().minLength(3),
    password: vine.string().minLength(8),
  });
const requestBodyValidator = vine.compile(requestBodySchema);

export const register = (router: Hono) => {
  router.get("/register", (c) => {
    const formErrors = c.get("session").get("flashFormErrors");
    return c.render(<AuthRegisterPage formErrors={formErrors ?? undefined} />);
  });

  router.post("/register", async (c) => {
    const { password, username } = await requestBodyValidator.validate(
      await c.req.parseBody(),
    );

    if (c.get("database").sql`select 1 from accounts`.length > 0) {
      c.get("session").flash("flashMessages", {
        error: ["An account already exists"],
      });

      return c.redirect("/auth/login");
    }

    c.get("database")
      .sql`
        insert into accounts (username, password)
        values (${username}, ${await hash(password)})
      `;

    c.get("session").flash("flashMessages", {
      success: ["Account created, you may login now"],
    });

    return c.redirect("/auth/login");
  });
};
