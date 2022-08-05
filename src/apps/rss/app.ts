import { rssMiddleware } from "#src/apps/rss/middlewares/rss-middleware.js";
import Koa from "koa";

export const app = () => {
  const koa = new Koa();

  koa.use(rssMiddleware);

  return koa;
};
