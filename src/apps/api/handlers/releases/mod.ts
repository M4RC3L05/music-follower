import { Env, Hono } from "hono";
import { SchemaType } from "#src/common/utils/types.js";
import { default as getReleases } from "./get-releases.js";
import { default as updateRelease } from "./update-release.js";

export const router = () => {
  let router = new Hono();

  router = getReleases(router);
  router = updateRelease(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof getReleases>> &
      SchemaType<ReturnType<typeof updateRelease>>,
    "/"
  >;
};
