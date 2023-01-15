import config from "config";

import * as database from "#src/database/index.js";
import * as remote from "#src/remote/index.js";
import { type ItunesArtistSearchModel } from "#src/remote/itunes/types.js";
import logger from "#src/utils/logger/logger.js";

import type { RouterContext } from "@koa/router";

const log = logger("artists-controller");

export const index = async (context: RouterContext) => {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const remoteArtistQuery = context.request.query?.remoteArtistQ as string;
  const limit = 12;
  const { data: artists, total } = database.artists.queries.searchPaginated({ limit, page, q: query as string });

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
        isSubscribed: database.artists.queries.getById(artist.artistId) !== undefined,
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

    database.artists.queries.create({ id: Number(artistId), name: artistName, imageUrl: artistImage });

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

    database.artists.queries.deleteById(Number(id));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully unsubscribed`);
  } catch (error: unknown) {
    log.error(error, `Could not unsubscribe from artists "${id}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not unsubscribe from artist`);
  }

  context.redirect("back");
};
