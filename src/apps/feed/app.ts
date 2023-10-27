import { App } from "@m4rc3l05/sss";

import { feedMiddleware } from "./middlewares/feed-middleware.js";
import requestLifeCycle from "#src/middlewares/request-lifecycle.js";

export const makeApp = () => {
  const app = new App();

  app.use(requestLifeCycle);
  app.use(feedMiddleware);

  return app;
};
