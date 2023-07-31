import Koa from "koa";
import favicon from "koa-favicon";

import { feedMiddleware } from "#src/apps/http/feed/middlewares/feed-middleware.js";
import logger from "#src/common/clients/logger.js";
import requestLifeCycle from "#src/common/middlewares/request-lifecycle.js";

export const app = () => {
  const koa = new Koa();

  koa.use(requestLifeCycle({ loggerFactory: logger }));
  koa.use(favicon("./src/apps/http/feed/favicon.ico"));
  koa.use(feedMiddleware);

  return koa;
};
