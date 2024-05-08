import config from "config";
import { Requester } from "@m4rc3l05/requester";
import * as requesterComposers from "@m4rc3l05/requester/composers";
import type {
  ItunesArtistSearchModel,
  ItunesResponseModel,
} from "#src/remote/itunes/types.ts";

type ItunesSearchConfig = { url: string; searchArtists: { limit: number } };

const itunesSearchConfig = config.get<ItunesSearchConfig>(
  "remote.itunes.search",
);
const requester = new Requester().with(
  requesterComposers.timeout({ ms: 10000 }),
);

export const searchArtists = async (query: string) => {
  const url = new URL(itunesSearchConfig.url);
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "musicArtist");
  url.searchParams.set("limit", String(itunesSearchConfig.searchArtists.limit));

  const response = await requester.fetch(url.toString());

  if (!response.ok) {
    throw new Error("An error ocurred while searching for artists", {
      cause: response.status,
    });
  }

  return (await response.json()) as ItunesResponseModel<
    ItunesArtistSearchModel
  >;
};
