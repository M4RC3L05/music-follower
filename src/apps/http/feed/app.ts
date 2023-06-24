import Koa from "koa";
import favicon from "koa-favicon";

import { feedMiddleware } from "#src/apps/http/feed/middlewares/feed-middleware.js";

export const app = () => {
  const koa = new Koa();

  koa.use(favicon("./src/apps/http/feed/favicon.ico"));
  koa.use(feedMiddleware);

  return koa;
};
