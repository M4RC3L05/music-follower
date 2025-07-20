import { Hono } from "@hono/hono";
import { index } from "#src/apps/web/routes/pages/index.tsx";
import { authMiddleware } from "#src/middlewares/mod.ts";

export const pagesRoutes = () => {
  const router = new Hono();

  router.use("/", authMiddleware);
  index(router);

  return router;
};
