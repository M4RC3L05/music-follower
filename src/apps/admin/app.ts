import { serveStatic } from "@hono/node-server/serve-static";
import config from "config";
import { ContextVariableMap, Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { StatusCode } from "hono/utils/http-status";
import { makeLogger } from "#src/common/logger/mod.js";
import { DeepPartial } from "#src/common/utils/types.js";
import { requestLifeCycle, serviceRegister } from "#src/middlewares/mod.js";
import { router } from "./router.js";

const log = makeLogger("admin");

export const makeApp = (deps: DeepPartial<ContextVariableMap>) => {
  const app = new Hono();

  app.use("*", requestLifeCycle);
  app.use("*", serviceRegister(deps));
  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    try {
      await next();
    } finally {
      // This is important so that we always make sure the browser will not cache the previous page
      // so that the requests are always made.
      if (
        !c.req.path.startsWith("/public") &&
        !c.req.path.startsWith("/deps")
      ) {
        c.header("cache-control", "no-cache, no-store, must-revalidate");
        c.header("pragma", "no-cache");
        c.header("expires", "0");
      }
    }
  });
  app.use(
    "*",
    basicAuth({
      username: config.get<{ name: string; pass: string }>(
        "apps.admin.basicAuth",
      ).name,
      password: config.get<{ name: string; pass: string }>(
        "apps.admin.basicAuth",
      ).pass,
    }),
  );

  app.get("/favicon.ico", serveStatic({ root: "./src/apps/admin/public" }));
  app.get(
    "/public/*",
    serveStatic({
      root: "./src/apps/admin/public",
      rewriteRequestPath: (path) => path.replace("/public", ""),
    }),
  );
  app.route(
    "/deps",
    new Hono()
      .get(
        "/simpledotcss/*",
        serveStatic({
          root: "./node_modules/simpledotcss",
          rewriteRequestPath: (path) => path.replace("/deps/simpledotcss", ""),
        }),
      )
      .get(
        "/htmx.org/*",
        serveStatic({
          root: "./node_modules/htmx.org",
          rewriteRequestPath: (path) => path.replace("/deps/htmx.org", ""),
        }),
      ),
  );

  router(app);

  app.onError((error, c) => {
    log.error(
      error instanceof Error || typeof error === "object" ? error : { error },
      "Something went wrong!",
    );

    if (error instanceof HTTPException) {
      if (error.res) {
        for (const [key, value] of error.res.headers.entries()) {
          c.header(key, value);
        }
      }
    }

    return c.text(
      error.message ? error.message : "Something broke",
      (error as Error & { status: StatusCode }).status ?? 500,
    );
  });

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  return app;
};
