import { type Context, type Next } from "koa";
import { pick } from "lodash-es";

import { type logger } from "#src/common/logger/mod.js";

type RequestLifeCycleDeps = {
  loggerFactory: typeof logger;
};

const requestLifeCycle = (deps: RequestLifeCycleDeps) => {
  const log = deps.loggerFactory("request-lifecycle-middleware");

  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } finally {
      log.info(
        {
          request: {
            ...pick(ctx.request, ["method", "url", "header"]),
            query: ctx.query,
            params: (ctx as any)?.params as unknown,
          },
          response: pick(ctx.response, ["status", "message", "header"]),
        },
        `Request ${ctx.req.method!} ${ctx.req.url!}`,
      );
    }
  };
};

export default requestLifeCycle;
