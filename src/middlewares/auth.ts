import { createMiddleware } from "@hono/hono/factory";

const authMiddleware = createMiddleware(async (c, next) => {
  const result = c.get("database")
    .sql`select 1 from accounts limit 1`;

  if (result.length <= 0) {
    c.get("session").flash("flashMessages", {
      error: ["No account is setup, please create one"],
    });

    return c.redirect("/auth/register");
  }

  const account = c.get("session").get("account");

  if (!account) {
    c.get("session").flash("flashMessages", {
      error: ["You are not logged in"],
    });

    return c.redirect("/auth/login");
  }

  return await next();
});

export default authMiddleware;
