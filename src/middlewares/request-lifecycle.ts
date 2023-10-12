import { type Context, type Next } from "koa";
import { pick } from "lodash-es";

import { makeLogger } from "#src/common/logger/mod.js";

const log = makeLogger("request-lifecycle-middleware");

const requestLifeCycle = async (ctx: Context, next: Next) => {
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

export default requestLifeCycle;
