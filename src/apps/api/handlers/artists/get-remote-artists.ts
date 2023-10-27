import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";
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

export const handler: RouteMiddleware = async (request, response) => {
  const query = request.searchParams as RequestQuery;

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

  response.statusCode = 200;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: remoteArtists }));
};
