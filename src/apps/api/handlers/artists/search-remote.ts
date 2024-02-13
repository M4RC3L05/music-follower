import { zValidator } from "@hono/zod-validator";
import sql from "@leafac/sqlite";
import config from "config";
import { type Hono } from "hono";
import { z } from "zod";

import { RequestValidationError } from "#src/errors/mod.js";
import {
  type ItunesArtistSearchModel,
  appleMusicRequests,
  itunesRequests,
} from "#src/remote/mod.js";

const requestQuerySchema = z.object({ q: z.string().optional() }).strict();

const handler = (router: Hono) => {
  return router.get(
    "/remote",
    zValidator("query", requestQuerySchema, (result) => {
      if (!result.success)
        throw new RequestValidationError({ request: { query: result.error } });
    }),
    async (c) => {
      const query = c.req.valid("query");

      const remoteArtistQuery = query.q;
      let remoteArtists: Array<
        ItunesArtistSearchModel & { image: string; isSubscribed: boolean }
      > = [];

      if (remoteArtistQuery && remoteArtistQuery.trim().length > 0) {
        const artistsSearch =
          await itunesRequests.searchArtists(remoteArtistQuery);

        const images = await Promise.allSettled(
          artistsSearch.results.map(async ({ artistLinkUrl }) =>
            appleMusicRequests.getArtistImage(artistLinkUrl),
          ),
        );

        remoteArtists = artistsSearch.results.map((artist, index) => ({
          ...artist,
          image:
            images.at(index)?.status === "rejected"
              ? config.get<string>("media.placeholderImage")
              : (images.at(index) as PromiseFulfilledResult<string>).value,
          isSubscribed:
            c
              .get("database")
              .get(
                sql`select id from artists where id = ${artist.artistId}`,
              ) !== undefined,
        }));

        return c.json({ data: remoteArtists }, 200);
      }
    },
  );
};

export default handler;
