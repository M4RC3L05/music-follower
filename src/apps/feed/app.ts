import Koa from "koa";
import favicon from "koa-favicon";

import { feedMiddleware } from "./middlewares/feed-middleware.js";
import requestLifeCycle from "#src/middlewares/request-lifecycle.js";

export const makeApp = () => {
  const koa = new Koa();

  koa.use(requestLifeCycle);
  koa.use(favicon("./src/apps/feed/favicon.ico"));
  koa.use(feedMiddleware);

  return koa;
};
