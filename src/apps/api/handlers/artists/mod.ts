import { Env, Hono } from "hono";
import type { SchemaType } from "#src/common/utils/types.js";
import { default as exportArtists } from "./export.js";
import { default as importArtists } from "./import.js";
import { default as searchRemoteArtists } from "./search-remote.js";
import { default as searchArtists } from "./search.js";
import { default as subscribeArtist } from "./subscribe.js";
import { default as unsubscribeArtist } from "./unsubscribe.js";

export const router = () => {
  let router = new Hono();

  router = exportArtists(router);
  router = searchRemoteArtists(router);
  router = searchArtists(router);
  router = importArtists(router);
  router = subscribeArtist(router);
  router = unsubscribeArtist(router);

  return router as Hono<
    Env,
    SchemaType<ReturnType<typeof exportArtists>> &
      SchemaType<ReturnType<typeof searchRemoteArtists>> &
      SchemaType<ReturnType<typeof searchArtists>> &
      SchemaType<ReturnType<typeof importArtists>> &
      SchemaType<ReturnType<typeof subscribeArtist>> &
      SchemaType<ReturnType<typeof unsubscribeArtist>>,
    "/"
  >;
};
