import Koa from "koa";
import qs from "koa-qs";

import { rssMiddleware } from "#src/apps/rss/middlewares/rss-middleware.ts";

export const app = () => {
  const koa = new Koa();
  qs(koa);

  koa.use(rssMiddleware);

  return koa;
};
