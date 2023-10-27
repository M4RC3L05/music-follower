import { type Middleware } from "@m4rc3l05/sss";
import { stdSerializers } from "pino";

import { makeLogger } from "../common/logger/mod.js";

const log = makeLogger("request-lifecycle-middleware");

const requestLifeCycle: Middleware = async (request, response, next) => {
  try {
    await next();
  } finally {
    log.info(
      { request: stdSerializers.req(request), response: stdSerializers.res(response) },
      `Request ${request.method!} ${request.url!}`,
    );
  }
};

export default requestLifeCycle;
