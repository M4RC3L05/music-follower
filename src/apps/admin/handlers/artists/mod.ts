import type { Hono } from "hono";
import * as exportPage from "./export.js";
import * as importPage from "./import.js";
import * as indexPage from "./index.js";
import * as remotePage from "./remote.js";
import * as unsubscribePage from "./unsubscribe.js";

export const handler = (router: Hono) => {
  exportPage.handler(router);
  importPage.handler(router);
  indexPage.handler(router);
  remotePage.handler(router);
  unsubscribePage.handler(router);
};
