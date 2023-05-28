import { type Context, type Next } from "koa";
import pick from "json-pick-keys";

import type logger from "#src/common/clients/logger.js";

type RequestLifeCycleDeps = {
  loggerFactory: typeof logger;
};

const requestLifeCycle = (deps: RequestLifeCycleDeps) => {
  const log = deps.loggerFactory("request-lifecycle-middleware");

  return async (ctx: Context, next: Next) => {
    log.info(
      {
        request: Object.assign(
          pick.default(ctx.request, ["method", "url", "header", "body"].join(" ")) as Record<string, unknown>,
          { query: ctx.query, params: (ctx as any)?.params as unknown },
        ),
      },
      `Incomming ${ctx.req.method!} ${ctx.req.url!}`,
    );

    try {
      await next();
    } finally {
      log.info(
        {
          request: Object.assign(
            pick.default(ctx.request, ["method", "url", "header", "body"].join(" ")) as Record<string, unknown>,
            { query: ctx.query, params: (ctx as any)?.params as unknown },
          ),
          response: pick.default(ctx.response, ["status", "message", "header", "body"].join(" ")) as Record<
            string,
            unknown
          >,
        },
        `Outgoing ${ctx.req.method!} ${ctx.req.url!}`,
      );
    }
  };
};

export default requestLifeCycle;
