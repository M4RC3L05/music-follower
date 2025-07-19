import config from "#src/common/config/mod.ts";
import type {
  ItunesLookupArtistModel,
  ItunesResponseModel,
} from "#src/remote/itunes/types.ts";

const itunesLookupConfig = config.remote.itunes.lookup;

export const getArtistById = async (
  id: number,
  signal?: AbortSignal,
) => {
  const url = new URL(itunesLookupConfig.url);
  url.searchParams.set("id", String(id));

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

  return ((await response.json()) as ItunesResponseModel<
    ItunesLookupArtistModel
  >).results.at(0);
};
