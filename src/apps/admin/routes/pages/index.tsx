import type { Hono } from "@hono/hono";
import { PagesIndexPage } from "#src/apps/admin/views/pages/pages/index.tsx";

export const index = (router: Hono) => {
  router.get("/", (c) => c.render(<PagesIndexPage />));
};
