import type { RouterContext } from "@koa/router";
import config from "config";

import makeLogger from "#src/core/clients/logger.js";
import artistRepository from "#src/data/artist/repositories/artist-repository.js";
import type { ItunesArtistSearchModel } from "#src/data/itunes/models/itunes-artists-search-model.js";
import itunesMediaRepository from "#src/data/itunes/repositories/itunes-media-repository.js";
import itunesSearchRepository from "#src/data/itunes/repositories/itunes-search-repository.js";

const logger = makeLogger(import.meta.url);

export async function index(context: RouterContext) {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const remoteArtistQuery = context.request.query?.remoteArtistQ as string;
  const limit = 12;
  const { results: artists, total } = await artistRepository.searchArtists({
    limit,
    page,
    q: query as string,
  });

  let remoteArtists: Array<ItunesArtistSearchModel & { image: string; isSubscribed: boolean }> = [];

  if (remoteArtistQuery && remoteArtistQuery.trim().length > 0) {
    const artistsSearch = await itunesSearchRepository.searchArtists(remoteArtistQuery);

    const images = await Promise.allSettled(
      artistsSearch.results.map(async ({ artistLinkUrl }) => itunesMediaRepository.getArtistsImage(artistLinkUrl)),
    );

    remoteArtists = await Promise.all(
      artistsSearch.results.map(async (artist, index) => ({
        ...artist,
        image:
          images.at(index)?.status === "rejected"
            ? config.get("media.placeholderImage")
            : (images.at(index) as PromiseFulfilledResult<string>).value,
        isSubscribed: Boolean(await artistRepository.getArtist(artist.artistId)),
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
    _csrf: context.state._csrf,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    flashMessages: context.flash(),
  });
}

export async function subscribe(context: RouterContext) {
  const { artistName, artistId, artistImage } = context.request.body as {
    artistName: string;
    artistId: string;
    artistImage: string;
  };

  try {
    logger.info({ artistName, artistId, artistImage }, "Subscribing");

    await artistRepository.addArtist({
      id: Number(artistId),
      name: artistName,
      imageUrl: artistImage,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully subscribed to "${artistName}"`);
  } catch (error: unknown) {
    console.log("eee", error);
    logger.error(error, `Could not subscribe to artists "${artistName}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not subscribe to artists "${artistName}"`);
  }

  context.redirect("back");
}

export async function unsubscribe(context: RouterContext) {
  const { id } = context.request.body as { id: string };

  try {
    await artistRepository.removeArtists(Number(id));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully unsubscribed`);
  } catch (error: unknown) {
    logger.error(error, `Could not unsubscribe from artists "${id}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not subscribe from artist`);
  }

  context.redirect("back");
}
