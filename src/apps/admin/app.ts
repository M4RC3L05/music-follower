import path from "node:path";
import process from "node:process";
import { stat } from "node:fs/promises";

import Koa from "koa";
import basicAuth from "koa-basic-auth";
import config from "config";
import koaStatic from "koa-static";
import proxy from "koa-proxies";

export const app = async () => {
  const koa = new Koa();

  koa.use(basicAuth({ ...config.get("apps.admin.basicAuth") }));

  koa.use(
    proxy(/^\/(stable|v\d+)/, {
      target: config.get("apps.admin.esmsh"),
      changeOrigin: true,
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    const swc = await import("@swc/core");
    const pathExists = async (path: string) => {
      try {
        const result = await stat(path);

        return result.isFile();
      } catch {
        return false;
      }
    };

    koa.use(async (ctx, next) => {
      if (!ctx.url.endsWith(".js")) {
        return next();
      }

      const tsxPath = path.resolve(`./src/apps/admin/public${ctx.url.replace(".js", ".tsx")}`);
      const tsPath = path.resolve(`./src/apps/admin/public${ctx.url.replace(".js", ".ts")}`);

      let data: Awaited<ReturnType<typeof swc.transformFile>> | undefined;

      if (await pathExists(tsxPath)) {
        data = await swc.transformFile(tsxPath);
      }

      if (await pathExists(tsPath)) {
        data = await swc.transformFile(tsPath);
      }

      if (!data) return next();

      ctx.type = "application/javascript";
      ctx.body = data?.code;
    });
  }

  koa.use(koaStatic("./src/apps/admin/public"));

  return koa;
};
