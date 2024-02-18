import { Env, Hono } from "hono";
import { SchemaType } from "#src/common/utils/types.js";
import { default as getRelease } from "./get.js";
import { default as getReleases } from "./search.js";
import { default as updateRelease } from "./update.js";

export const router = () => {
  let router = new Hono();

  router = getRelease(router);
  router = getReleases(router);
  router = updateRelease(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof getRelease>> &
      SchemaType<ReturnType<typeof getReleases>> &
      SchemaType<ReturnType<typeof updateRelease>>,
    "/"
  >;
};
