import Koa from "koa";
import basicAuth from "koa-basic-auth";
import config from "config";
import koaStatic from "koa-static";
import proxy from "koa-proxies";

export const app = () => {
  const koa = new Koa();

  koa.use(basicAuth({ ...config.get("apps.admin.basicAuth") }));
  koa.use(koaStatic("./src/apps/http/admin/public"));
  koa.use(
    proxy("/deps", {
      target: config.get("apps.admin.esmsh"),
      rewrite: (path) => path.replace("/deps", ""),
      changeOrigin: true,
    }),
  );

  return koa;
};
