import { type Context, type Next } from "hono";

import { makeLogger } from "../common/logger/mod.js";

const log = makeLogger("request-lifecycle-middleware");

const requestLifeCycle = async (c: Context, next: Next) => {
  try {
    await next();
  } finally {
    log.info(
      {
        request: {
          headers: Object.fromEntries(c.req.raw.headers.entries()),
          method: c.req.method,
          url: c.req.url,
          path: c.req.path,
        },
        response: {
          headers: Object.fromEntries(c.res.headers.entries()),
          statusCode: c.res.status,
        },
      },
      `Request ${c.req.method} ${c.req.path}`,
    );
  }
};

export default requestLifeCycle;
