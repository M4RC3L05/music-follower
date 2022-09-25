import type { RouterContext } from "@koa/router";
import config from "config";

import { makeLogger } from "#src/core/clients/logger.ts";
import { appleMusicMediaService } from "#src/core/services/apple-music-media-service.ts";
import type { ItunesArtistSearchResult } from "#src/core/services/itunes-search-service.ts";
import { itunesSearchService } from "#src/core/services/itunes-search-service.ts";
import { artistRepository } from "#src/entities/artist/repositories/artist-repository.ts";

const logger = makeLogger("artists-controller");

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

  let remoteArtistsSearch: ItunesArtistSearchResult[] = [];

  if (remoteArtistQuery && remoteArtistQuery.trim().length > 0) {
    remoteArtistsSearch = (await itunesSearchService.searchArtists(remoteArtistQuery)) as ItunesArtistSearchResult[];
    const images = await Promise.allSettled(
      remoteArtistsSearch.map(async ({ artistLinkUrl }) => appleMusicMediaService.getArtistImage(artistLinkUrl)),
    );
    remoteArtistsSearch = remoteArtistsSearch.map((artist, index_) => {
      const img = images[index_];

      if (img.status === "rejected") {
        logger.warn({ img }, "Artist image does not seams to be a valid image");

        return { ...artist, image: config.get("media.placeholderImage") };
      }

      return { ...artist, image: img.value };
    });
    remoteArtistsSearch = await Promise.all(
      remoteArtistsSearch.map(async (artist) => ({
        ...artist,
        isSubscribed: Boolean(await artistRepository.getArtist(artist.artistId)),
      })),
    );
  }

  await context.render("artists/index", {
    artists,
    total,
    page,
    limit,
    query,
    remoteArtists: remoteArtistsSearch,
    remoteArtistQuery,
    _csrf: context.state._csrf,
    flashMessages: context.flash(),
  });
}

export async function subscribe(context: RouterContext) {
  const { artistName, artistId, artistImage } = context.request.body;

  try {
    logger.info({ artistName, artistId, artistImage }, "Subscribing");

    await artistRepository.addArtist({
      id: Number(artistId as string),
      name: artistName as string,
      imageUrl: artistImage as string,
    });

    context.flash("success", `Successfully subscribed to "${artistName as string}"`);
  } catch (error: unknown) {
    logger.error(error, `Could not subscribe to artists "${artistName as string}"`);

    context.flash("error", `Could not subscribe to artists "${artistName as string}"`);
  }

  context.redirect("back");
}

export async function unsubscribe(context: RouterContext) {
  const { id } = context.request.body;

  try {
    await artistRepository.removeArtists(Number(id));

    context.flash("success", `Successfully unsubscribed`);
  } catch (error: unknown) {
    logger.error(error, `Could not unsubscribe from artists "${id as string}"`);

    context.flash("error", `Could not subscribe from artist`);
  }

  context.redirect("back");
}
