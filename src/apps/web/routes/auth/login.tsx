import type { Hono } from "@hono/hono";
import { AuthLoginPage } from "#src/apps/web/views/auth/pages/login.tsx";
import vine from "@vinejs/vine";
import { verify } from "#src/common/crypto/mod.ts";

const requestBodySchema = vine
  .object({
    username: vine.string(),
    password: vine.string(),
  });
const requestBodyValidator = vine.compile(requestBodySchema);

export const login = (router: Hono) => {
  router.get("/login", (c) => {
    const formErrors = c.get("session").get("flashFormErrors");
    return c.render(<AuthLoginPage formErrors={formErrors ?? undefined} />);
  });

  router.post("/login", async (c) => {
    const { password, username } = await requestBodyValidator.validate(
      await c.req.parseBody(),
    );

    const [account] = c.get("database")
      .sql<
      { username: string; password: string }
    >`select username, password from accounts where username = ${username} limit 1`;

    if (!account) {
      c.get("session").flash("flashMessages", {
        "error": ["Not matching username or password"],
      });

      return c.redirect("/auth/login");
    }

    if (!(await verify(password, account.password))) {
      c.get("session").flash("flashMessages", {
        "error": ["Not matching username or password"],
      });

      return c.redirect("/auth/login");
    }

    c.get("session").reupSession();
    c.get("session").set("account", account.username);

    c.get("session").flash("flashMessages", {
      success: ["Successfull login"],
    });

    return c.redirect("/");
  });
};
