import type { Hono } from "@hono/hono";

export const logout = (router: Hono) => {
  router.post("/logout", (c) => {
    c.get("session").forget("account");
    c.get("session").flash("flashMessages", {
      success: ["Successfull logout"],
    });

    return c.redirect("/auth/login");
  });
};
