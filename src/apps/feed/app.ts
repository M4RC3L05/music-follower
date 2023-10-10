import Koa from "koa";
import favicon from "koa-favicon";

import { feedMiddleware } from "./middlewares/feed-middleware.js";
import { logger } from "#src/common/logger/mod.js";
import requestLifeCycle from "#src/middlewares/request-lifecycle.js";

export const app = () => {
  const koa = new Koa();

  koa.use(requestLifeCycle({ loggerFactory: logger }));
  koa.use(favicon("./src/apps/feed/favicon.ico"));
  koa.use(feedMiddleware);

  return koa;
};
