import Koa from "koa";
import basicAuth from "koa-basic-auth";
import bodyParser from "koa-bodyparser";
import config from "config";
import cors from "@koa/cors";

import { errorMapper, requestLifeCycle } from "#src/middlewares/mod.js";
import { errorMappers } from "#src/errors/mod.js";
import router from "./router.js";

export const makeApp = () => {
  const app = new Koa();

  app.use(requestLifeCycle);
  app.use(
    errorMapper({
      defaultMapper: errorMappers.defaultErrorMapper,
      mappers: [errorMappers.validationErrorMapper],
    }),
  );
  app.use(cors());
  app.use(basicAuth({ ...config.get("apps.api.basicAuth") }));
  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
};
