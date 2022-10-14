import Koa from "koa";
import qs from "koa-qs";

import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.js";

export const app = () => {
  const koa = new Koa();
  qs(koa);

  koa.use(feedMiddleware);

  return koa;
};
