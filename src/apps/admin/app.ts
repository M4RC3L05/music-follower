import path from "node:path";
import process from "node:process";

import Koa from "koa";
import basicAuth from "koa-basic-auth";
import bodyParser from "koa-bodyparser";
import config from "config";
import flash from "koa-better-flash";
import koaStatic from "koa-static";
import qs from "koa-qs";
import render from "@koa/ejs";
import session from "koa-session";

import router from "#src/apps/admin/router.js";

export const app = () => {
  const koa = new Koa();
  koa.keys = config.get("apps.admin.keys");

  qs(koa);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  render(koa, {
    root: path.resolve("./src/apps/admin/views"),
    layout: "main",
    viewExt: "ejs",
    cache: process.env.NODE_ENV === "production",
    debug: false,
  });

  koa.use(session({ ...config.get("apps.admin.session") }, koa));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  koa.use(flash());
  koa.use(bodyParser());
  koa.use(koaStatic("./static"));
  koa.use(basicAuth({ ...config.get("apps.admin.basicAuth") }));
  koa.use(router.middleware());
  koa.use(router.allowedMethods());

  return koa;
};
