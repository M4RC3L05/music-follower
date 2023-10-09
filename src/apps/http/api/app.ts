import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";

import * as errorMappers from "#src/common/errors/mappers/mod.js";
import { errorMapper, requestLifeCycle } from "#src/common/middlewares/mod.js";
import logger from "#src/common/clients/logger.js";
import router from "./router.js";

export const app = () => {
  const app = new Koa();

  app.use(requestLifeCycle({ loggerFactory: logger }));
  app.use(
    errorMapper({
      loggerFactory: logger,
      defaultMapper: errorMappers.defaultErrorMapper,
      mappers: [errorMappers.validationErrorMapper],
    }),
  );
  app.use(cors());
  // App.use(basicAuth({ ...config.get("apps.api.basicAuth") }));
  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
};
