import config from "config";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import render from "koa-ejs";
import qs from "koa-qs";
import session from "koa-session";
import koaStatic from "koa-static";
import path from "node:path";
import url from "node:url";

import router from "#src/apps/admin/router.js";

export const app = () => {
  const koa = new Koa();
  koa.keys = config.get("apps.admin.keys");

  qs(koa);
  render(koa, {
    root: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "views"),
    layout: "main",
    viewExt: "ejs",
    cache: process.env.NODE_ENV === "production",
    debug: false,
  });

  koa.use(session({ ...config.get("apps.admin.session") }, koa));
  koa.use(bodyParser());
  koa.use(koaStatic(path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../../../public")));
  koa.use(router.middleware());
  koa.use(router.allowedMethods());

  return koa;
};
