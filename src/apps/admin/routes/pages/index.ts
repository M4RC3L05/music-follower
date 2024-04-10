import type { Hono } from "hono";
import { pagesViews } from "#src/apps/admin/views/mod.ts";

export const index = (router: Hono) => {
  router.get("/", (c) => c.html(pagesViews.pages.Index()));
};
