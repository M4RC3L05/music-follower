import { RouterContext } from "@koa/router";
import config from "config";

import { makeLogger } from "#src/core/clients/logger.js";
import { appleMusicMediaService } from "#src/core/services/apple-music-media-service.js";
import { ItunesArtistSearchResult, itunesSearchService } from "#src/core/services/itunes-search-service.js";
import { ArtistModel } from "#src/entities/artist/models/artist-model.js";
import { artistRepository } from "#src/entities/artist/repositories/artist-repository.js";

const logger = makeLogger("artists-controller");

export async function index(context: RouterContext) {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const remoteArtistQuery = context.request.query?.remoteArtistQ as string;
  const limit = 12;
  const { results: artists, total } = await artistRepository.searchArtists({ limit, page, q: query as string });

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
        isSubscribed: (await artistRepository.getArtist(artist.artistId)) instanceof ArtistModel,
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
  });
}

export async function subscribe(context: RouterContext) {
  const { artistName, artistId, artistImage } = context.request.body;

  await artistRepository.addArtist({ id: artistId, name: artistName, imageUrl: artistImage });

  context.redirect("back");
}

export async function unsubscribe(context: RouterContext) {
  const { id } = context.request.body;

  await artistRepository.deleteArtist(id);

  context.redirect("back");
}
