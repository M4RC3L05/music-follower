import path from "node:path";
import url from "node:url";

import config from "config";
import Koa from "koa";
import basicAuth from "koa-basic-auth";
import flash from "koa-better-flash";
import bodyParser from "koa-bodyparser";
import Csrf from "koa-csrf";
import render from "koa-ejs";
import qs from "koa-qs";
import session from "koa-session";
import koaStatic from "koa-static";

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
  koa.use(flash());
  koa.use(bodyParser());
  koa.use(new Csrf());
  koa.use(koaStatic(path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../../../public")));
  koa.use(basicAuth({ ...config.get("apps.admin.basicAuth") }));
  koa.use(router.middleware());
  koa.use(router.allowedMethods());

  return koa;
};
