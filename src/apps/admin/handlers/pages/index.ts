import type { Hono } from "hono";
import { pagesViews } from "../../views/mod.js";

export const handler = (router: Hono) => {
  router.get("/", (c) => c.html(pagesViews.pages.Index()));
};
