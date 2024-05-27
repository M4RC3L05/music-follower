import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import {
  appleMusicRequests,
  type ItunesArtistSearchModel,
  itunesRequests,
} from "#src/remote/mod.ts";
import config from "config";

const requestQuerySchema = vine.object({
  q: vine.string().trim().minLength(1),
});
const requestQueryValidator = vine.compile(requestQuerySchema);

export const searchRemote = (router: Hono) => {
  return router.get("/remote", async (c) => {
    const query = await requestQueryValidator.validate(c.req.query());

    const remoteArtistQuery = query.q;
    let remoteArtists: Array<
      ItunesArtistSearchModel & { image: string; isSubscribed: boolean }
    > = [];

    const artistsSearch = await itunesRequests.searchArtists(
      remoteArtistQuery,
    );

    const images = await Promise.allSettled(
      artistsSearch.results.map(({ artistLinkUrl }) =>
        appleMusicRequests.getArtistImage(artistLinkUrl)
      ),
    );

    remoteArtists = artistsSearch.results.map((artist, index) => ({
      ...artist,
      image: images.at(index)?.status === "rejected"
        ? config.get<string>("media.placeholderImage")
        : (images.at(index) as PromiseFulfilledResult<string>).value,
      isSubscribed: c
        .get("database")
        .get(
          sql`select id from artists where id = ${artist.artistId}`,
        ) !== undefined,
    }));

    return c.json({ data: remoteArtists }, 200);
  });
};
