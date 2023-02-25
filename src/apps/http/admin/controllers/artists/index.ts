import config from "config";

import * as remote from "#src/remote/mod.js";
import { type ItunesArtistSearchModel } from "#src/remote/itunes/types.js";
import { artistQueries } from "#src/domain/artists/mod.js";
import logger from "#src/common/clients/logger.js";

import type { RouterContext } from "@koa/router";

const log = logger("index-artists-handler");

export const index = async (context: RouterContext) => {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const remoteArtistQuery = context.request.query?.remoteArtistQ as string;
  const limit = 12;
  const { data: artists, total } = artistQueries.searchPaginated({ limit, page, q: query as string });

  let remoteArtists: Array<ItunesArtistSearchModel & { image: string; isSubscribed: boolean }> = [];

  if (remoteArtistQuery && remoteArtistQuery.trim().length > 0) {
    const artistsSearch = await remote.itunes.requests.searchArtists(remoteArtistQuery);

    const images = await Promise.allSettled(
      artistsSearch.results.map(async ({ artistLinkUrl }) => remote.appleMusic.requests.getArtistImage(artistLinkUrl)),
    );

    remoteArtists = await Promise.all(
      artistsSearch.results.map(async (artist, index) => ({
        ...artist,
        image:
          images.at(index)?.status === "rejected"
            ? config.get<string>("media.placeholderImage")
            : (images.at(index) as PromiseFulfilledResult<string>).value,
        isSubscribed: artistQueries.getById(artist.artistId) !== undefined,
      })),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await context.render("artists/index", {
    artists,
    total,
    page,
    limit,
    query,
    remoteArtists,
    remoteArtistQuery,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    flashMessages: context.flash(),
  });
};
