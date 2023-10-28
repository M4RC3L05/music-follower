import { App } from "@m4rc3l05/sss";
import config from "config";

import { basicAuth, cors, errorMapper, requestLifeCycle } from "#src/middlewares/mod.js";
import { errorMappers } from "#src/errors/mod.js";
import { makeRouter } from "./router.js";

export const makeApp = async () => {
  const app = new App();

  app.onError(
    errorMapper({
      defaultMapper: errorMappers.defaultErrorMapper,
      mappers: [errorMappers.validationErrorMapper],
    }),
  );

  const router = await makeRouter(app);

  app.use(requestLifeCycle);
  app.use(cors);
  app.use(basicAuth({ user: config.get("apps.api.basicAuth") }));
  app.use(router.middleware());
  app.use((_, response) => {
    response.statusCode = 404;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "not_found", msg: "Not found" } }));
  });

  return app;
};
