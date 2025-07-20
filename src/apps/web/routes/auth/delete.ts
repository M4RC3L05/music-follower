import type { Hono } from "@hono/hono";
import { authMiddleware } from "#src/middlewares/mod.ts";

export const del = (router: Hono) => {
  router.post("/delete", authMiddleware, (c) => {
    c.get("database").sql`delete from accounts`;
    c.get("session").forget("account");
    c.get("session").flash("flashMessages", {
      success: [
        "Successfull deleted account, you will need to setup a new one.",
      ],
    });

    return c.redirect("/auth/register");
  });
};
