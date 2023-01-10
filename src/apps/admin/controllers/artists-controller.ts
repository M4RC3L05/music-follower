import type { RouterContext } from "@koa/router";
import config from "config";

import { artistQueries } from "#src/database/tables/artists/index.js";
import { appleMusicRequests } from "#src/remote/sources/apple-music/index.js";
import { type ItunesArtistSearchModel, itunesRequests } from "#src/remote/sources/itunes/index.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("artists-controller");

export const index = async (context: RouterContext) => {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const remoteArtistQuery = context.request.query?.remoteArtistQ as string;
  const limit = 12;
  const { data: artists, total } = artistQueries.searchPaginated({ limit, page, q: query as string });

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

export const subscribe = async (context: RouterContext) => {
  const { artistName, artistId, artistImage } = context.request.body as {
    artistName: string;
    artistId: string;
    artistImage: string;
  };

  try {
    log.info({ artistName, artistId, artistImage }, "Subscribing");

    artistQueries.add({ id: Number(artistId), name: artistName, imageUrl: artistImage });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully subscribed to "${artistName}"`);
  } catch (error: unknown) {
    log.error(error, `Could not subscribe to artists "${artistName}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not subscribe to artists "${artistName}"`);
  }

  context.redirect("back");
};

export const unsubscribe = async (context: RouterContext) => {
  const { id } = context.request.body as { id: string };

  try {
    log.info({ artistId: id }, "Unsubscribing");

    artistQueries.deleteById(Number(id));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully unsubscribed`);
  } catch (error: unknown) {
    log.error(error, `Could not unsubscribe from artists "${id}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not subscribe from artist`);
  }

  context.redirect("back");
};
