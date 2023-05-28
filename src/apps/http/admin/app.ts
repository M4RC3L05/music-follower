import Koa from "koa";
import basicAuth from "koa-basic-auth";
import config from "config";
import koaStatic from "koa-static";

export const app = () => {
  const koa = new Koa();

  koa.use(basicAuth({ ...config.get("apps.admin.basicAuth") }));
  koa.use(koaStatic("./src/apps/http/admin/public"));

  return koa;
};
