import { type Middleware } from "@m4rc3l05/sss";
import { stdSerializers } from "pino";

import { makeLogger } from "../common/logger/mod.js";

const log = makeLogger("request-lifecycle-middleware");

const requestLifeCycle: Middleware = (request, response, next) => {
  response.addListener("finish", function onFinish() {
    log.info(
      { request: stdSerializers.req(request), response: stdSerializers.res(response) },
      `Request ${request.method!} ${request.url!}`,
    );

    response.removeListener("finish", onFinish);
  });

  return next();
};

export default requestLifeCycle;
