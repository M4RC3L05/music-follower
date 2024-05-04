import { Hono } from "hono";
import { index } from "#src/apps/admin/routes/pages/index.tsx";

export const pagesRoutes = () => {
  const router = new Hono();

  index(router);

  return router;
};
