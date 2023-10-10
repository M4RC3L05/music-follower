import { type FromSchema } from "json-schema-to-ts";
import { type RouterContext } from "@koa/router";
import config from "config";

import { type ItunesArtistSearchModel, appleMusicRequests, itunesRequests } from "#src/remote/mod.js";
import { artistsQueries } from "#src/database/mod.js";

export const schemas = {
  request: {
    query: {
      $id: "get-artists-remote-request-query",
      type: "object",
      properties: { q: { type: "string" } },
      required: ["q"],
      additionalProperties: false,
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler = async (context: RouterContext) => {
  const query = context.query as RequestQuery;

  const remoteArtistQuery = query.q;
  let remoteArtists: Array<ItunesArtistSearchModel & { image: string; isSubscribed: boolean }> = [];

  if (remoteArtistQuery && remoteArtistQuery.trim().length > 0) {
    const artistsSearch = await itunesRequests.searchArtists(remoteArtistQuery);

    const images = await Promise.allSettled(
      artistsSearch.results.map(async ({ artistLinkUrl }) => appleMusicRequests.getArtistImage(artistLinkUrl)),
    );

    remoteArtists = await Promise.all(
      artistsSearch.results.map(async (artist, index) => ({
        ...artist,
        image:
          images.at(index)?.status === "rejected"
            ? config.get<string>("media.placeholderImage")
            : (images.at(index) as PromiseFulfilledResult<string>).value,
        isSubscribed: artistsQueries.getById(artist.artistId) !== undefined,
      })),
    );
  }

  context.body = { data: remoteArtists };
};
