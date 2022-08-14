import Koa from "koa";

import { rssMiddleware } from "#src/apps/rss/middlewares/rss-middleware.js";

export const app = () => {
  const koa = new Koa();

  koa.use(rssMiddleware);

  return koa;
};
