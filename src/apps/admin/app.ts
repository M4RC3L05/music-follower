import path from "node:path";
import process from "node:process";
import { stat } from "node:fs/promises";

import { App } from "@m4rc3l05/sss";
import config from "config";
import httpProxy from "http-proxy";
import { isHttpError } from "http-errors";
import sirv from "sirv";

import { basicAuth, requestLifeCycle } from "#src/middlewares/mod.js";

export const makeApp = async () => {
  const app = new App();
  const proxy = httpProxy.createProxy({
    changeOrigin: true,
    target: config.get<string>("apps.admin.esmsh"),
  });

  app.onError((error, _, response) => {
    response.setHeader("content-type", "text/html");

    if (isHttpError(error)) {
      response.statusCode = error.statusCode;

      if (error.headers) {
        for (const [key, value] of Object.entries(error.headers)) {
          response.setHeader(key, value);
        }
      }

      response.end(error.message);

      return;
    }

    response.statusCode = 500;

    response.end("Internal server error");
  });

  app.use(requestLifeCycle);
  app.use(basicAuth({ user: config.get("apps.admin.basicAuth") }));

  app.use((request, response, next) => {
    if (!/^\/(stable|v\d+)/.test(request.url ?? "")) return next();

    proxy.web(request, response, undefined, next);
  });

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

    app.use(async (request, response, next) => {
      if (!request.url!.endsWith(".js")) {
        return next();
      }

      const tsxPath = path.resolve(`./src/apps/admin/public${request.url!.replace(".js", ".tsx")}`);
      const tsPath = path.resolve(`./src/apps/admin/public${request.url!.replace(".js", ".ts")}`);

      let data: Awaited<ReturnType<typeof swc.transformFile>> | undefined;

      if (await pathExists(tsxPath)) {
        data = await swc.transformFile(tsxPath);
      }

      if (await pathExists(tsPath)) {
        data = await swc.transformFile(tsPath);
      }

      if (!data) return next();

      response.statusCode = 200;

      response.setHeader("content-type", "application/javascript");
      response.end(data?.code);
    });
  }

  app.use(sirv("./src/apps/admin/public"));

  app.use((_, response) => {
    response.statusCode = 404;

    response.setHeader("content-type", "text/html");
    response.end("Not found");
  });

  return app;
};
