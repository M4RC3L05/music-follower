import { Hono } from "@hono/hono";
import { login } from "#src/apps/web/routes/auth/login.tsx";
import { register } from "#src/apps/web/routes/auth/register.tsx";
import { logout } from "#src/apps/web/routes/auth/logout.ts";
import { del } from "#src/apps/web/routes/auth/delete.ts";

export const authRoutes = () => {
  const router = new Hono();

  login(router);
  register(router);
  logout(router);
  del(router);

  return router;
};
