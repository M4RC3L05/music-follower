import Koa from "koa";

import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.js";

export const app = () => {
  const koa = new Koa();

  koa.use(feedMiddleware);

  return koa;
};
