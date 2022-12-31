import Koa from "koa";
import favicon from "koa-favicon";

import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.js";

export const app = () => {
  const koa = new Koa();

  koa.use(favicon("./static/favicon.ico"));
  koa.use(feedMiddleware);

  return koa;
};
