import type { Hono } from "hono";
import * as indexPage from "./index.js";

export const handler = (router: Hono) => {
  indexPage.handler(router);
};
