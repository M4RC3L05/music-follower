import process from "node:process";

import Koa from "koa";
import basicAuth from "koa-basic-auth";
import config from "config";
import koaStatic from "koa-static";
import proxy from "koa-proxies";

export const app = () => {
  const koa = new Koa();

  koa.use(basicAuth({ ...config.get("apps.admin.basicAuth") }));

  koa.use(
    proxy(/^\/(stable|v\d+)/, {
      target: config.get("apps.admin.esmsh"),
      changeOrigin: true,
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    void import("@swc/core").then((swc) => {
      koa.use(async (ctx, next) => {
        if (ctx.url.endsWith(".js")) {
          const data = await swc.transformFile(`./src/apps/http/admin/public${ctx.url.replace(".js", ".ts")}`);
          ctx.type = "application/javascript";
          ctx.body = data.code;

          return;
        }

        return next();
      });
    });
  }

  koa.use(koaStatic("./src/apps/http/admin/public"));

  return koa;
};
