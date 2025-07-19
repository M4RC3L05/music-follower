import config from "#src/common/config/mod.ts";
import type {
  ItunesArtistSearchModel,
  ItunesResponseModel,
} from "#src/remote/itunes/types.ts";

const itunesSearchConfig = config.remote.itunes.search;

export const searchArtists = async (
  query: string,
  signal?: AbortSignal,
) => {
  const url = new URL(itunesSearchConfig.url);
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "musicArtist");
  url.searchParams.set("limit", String(itunesSearchConfig.searchArtists.limit));

  const response = await fetch(url.toString(), {
    signal: signal
      ? AbortSignal.any([AbortSignal.timeout(10_000), signal])
      : AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error("An error ocurred while searching for artists", {
      cause: response.status,
    });
  }

  return (await response.json()) as ItunesResponseModel<
    ItunesArtistSearchModel
  >;
};
