import config from "config";
import type {
  ItunesArtistSearchModel,
  ItunesResponseModel,
} from "#src/remote/itunes/types.ts";

type ItunesSearchConfig = { url: string; searchArtists: { limit: number } };

const itunesSearchConfig = config.get<ItunesSearchConfig>(
  "remote.itunes.search",
);

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
