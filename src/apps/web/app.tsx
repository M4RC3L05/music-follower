import { serveStatic } from "@hono/hono/deno";
import config from "config";
import { type ContextVariableMap, Hono } from "@hono/hono";
import {
  MemoryStore,
  type Session,
  sessionMiddleware,
} from "@jcs224/hono-sessions";
import { csrf } from "@hono/hono/csrf";
import { jsxRenderer } from "@hono/hono/jsx-renderer";
import { HTTPException } from "@hono/hono/http-exception";
import { secureHeaders } from "@hono/hono/secure-headers";
import { makeLogger } from "#src/common/logger/mod.ts";
import { router } from "#src/apps/web/routes/mod.ts";
import { MainLayout } from "#src/apps/web/views/common/layouts/main.tsx";
import { serviceRegister } from "#src/middlewares/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";
import { PagesErrorPage } from "./views/pages/pages/error.tsx";
import type { MiddlewareHandler } from "@hono/hono";
import { STATUS_TEXT, type StatusCode } from "@std/http";
import type {
  SessionFlashFormErrors,
  SessionFlashMessages,
} from "#src/apps/web/types.ts";
import { MultipartParseError } from "@mjackson/multipart-parser";
import { errors } from "@vinejs/vine";
import { feedRoutes } from "#src/apps/web/routes/feed/mod.ts";

const log = makeLogger("admin");

declare module "@hono/hono" {
  interface ContextVariableMap {
    database: CustomDatabase;
    shutdown: AbortSignal;
    session: Session<
      {
        flashMessages?: SessionFlashMessages;
        flashFormErrors?: SessionFlashFormErrors;
      }
    >;
  }

  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: { error?: boolean },
    ): Response;
  }
}

export const makeApp = (deps: Partial<ContextVariableMap>) => {
  const app = new Hono();

  app.onError((error, c) => {
    log.error("Something went wrong!", { error });

    if (error instanceof HTTPException) {
      if (error.res) {
        error.res.headers.forEach((value, key) => {
          c.header(key, value);
        });
      }
    }

    if ((error instanceof HTTPException && error.status === 422)) {
      c.get("session").flash("flashMessages", { error: [error.message] });

      if (error.cause) {
        c.get("session").flash(
          "flashFormErrors",
          error.cause as SessionFlashFormErrors,
        );
      }

      return c.redirect(c.req.header("Referer") ?? "/");
    }

    if (error instanceof errors.E_VALIDATION_ERROR) {
      c.get("session").flash("flashMessages", { error: [error.message] });
      c.get("session").flash(
        "flashFormErrors",
        (error.messages as { message: string; field: string }[]).reduce(
          (acc, curr) => {
            const errMessages = acc[curr.field] ?? [];
            errMessages.push(curr.message);
            acc[curr.field] = errMessages;
            return acc;
          },
          {} as Record<string, string[]>,
        ),
      );

      return c.redirect(c.req.header("Referer") ?? "/");
    }

    if (error instanceof MultipartParseError) {
      c.get("session").flash("flashMessages", { error: [error.message] });
      return c.redirect(c.req.header("Referer") ?? "/");
    }

    const errorMessage = error instanceof HTTPException
      ? (error.message.trim().length > 0 ? error.message : undefined) ??
        STATUS_TEXT[error.status as StatusCode] ??
        "Something broke..."
      : "Something broke...";
    c.status(error instanceof HTTPException ? error.status : 500);

    return c.render(<PagesErrorPage errorMessage={errorMessage} />, {
      error: true,
    });
  });

  app.notFound((c) => {
    c.status(404);
    return c.render(<PagesErrorPage errorMessage="Not found" />, {
      error: true,
    });
  });

  app.use("*", async (c, next) => {
    const nocache = () => {
      // This is important so that we always make sure the browser will not cache the previous page
      // so that the requests are always made.
      c.header("cache-control", "no-cache, no-store, must-revalidate");
      c.header("pragma", "no-cache");
      c.header("expires", "0");
    };

    try {
      await next();

      if (
        !(c.req.path.includes("/favicon") || c.req.path.includes("/public") ||
          c.req.path.includes("/deps"))
      ) {
        nocache();
      } else {
        c.header("Cache-Control", `max-age=${60 * 60 * 24}`);
      }
    } catch (error) {
      if (
        !(c.req.path.includes("/favicon") || c.req.path.includes("/public") ||
          c.req.path.includes("/deps"))
      ) {
        nocache();
      } else {
        c.header("Cache-Control", `max-age=${60 * 60 * 24}`);
      }

      throw error;
    }
  });
  app.use("*", serviceRegister(deps));
  app.use(
    "*",
    secureHeaders({ referrerPolicy: "strict-origin-when-cross-origin" }),
  );

  app.route("/feeds", feedRoutes());
  app.get("/favicon.ico", serveStatic({ root: "./src/apps/web/public" }));
  app.get(
    "/public/*",
    serveStatic({
      root: "./src/apps/web/public",
      rewriteRequestPath: (path) => path.replace("/public", ""),
    }),
  );
  app.get(
    "/deps/*",
    serveStatic({
      root: "./node_modules",
      rewriteRequestPath: (path) => path.replace("/deps", ""),
    }),
  );

  app.use(
    "*",
    sessionMiddleware({
      store: new MemoryStore(),
      encryptionKey: "foobarfoobarfoobarfoobarfoobarfoobarfoobarfoobarfoobar",
      expireAfterSeconds: 60 * 15,
      sessionCookieName: "sid",
      cookieOptions: {
        sameSite: "strict",
        path: "/",
        httpOnly: true,
        secure: true,
      },
    }) as unknown as MiddlewareHandler,
  );

  app.use(
    "*",
    jsxRenderer(({ children, error = false }, c) => {
      const flashMessages = c.get("session").get("flashMessages");

      return (
        <MainLayout
          path={c.req.path}
          flashMessages={flashMessages ?? undefined}
          enableNavbar={!error}
        >
          {children}
        </MainLayout>
      );
    }, {
      docType: true,
      stream: true,
    }),
  );

  app.use(
    "*",
    csrf({
      origin: (origin) => new RegExp(config.get("csrf.origin")).test(origin),
    }),
  );

  if (Deno.env.get("ENV") === "test") {
    app.get("/test/flash-messages", (c) => {
      c.get("session").flash("flashMessages", {
        error: ["error", "error2"],
        info: ["info"],
        success: ["success"],
        warning: ["warning"],
      });

      return c.render("");
    });

    app.get("/test/error", (c) => {
      const { type } = c.req.query();

      if (type === "http") {
        throw new HTTPException(400, {
          res: new Response(null, { headers: { "x-foo": "bar" } }),
        });
      }

      if (type === "http422") {
        throw new HTTPException(422, {
          message: "foo",
          cause: { foo: ["yes"] },
        });
      }

      if (type === "valierr") {
        const e = new errors.E_VALIDATION_ERROR([{
          message: "lorem ipsum",
          field: "foo",
        }, {
          message: "lorem lorem",
          field: "bar",
        }]);

        e.message = "foo";

        throw e;
      }

      if (type === "multparterr") {
        throw new MultipartParseError("foo");
      }

      throw new Error("foo");
    });
  }

  return app.route("/", router());
};
