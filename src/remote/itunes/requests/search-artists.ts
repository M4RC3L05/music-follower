import config from "config";
import fetch from "node-fetch";

import { type ItunesArtistSearchModel, type ItunesResponseModel } from "../types.js";

type ItunesSearchConfig = { url: string; searchArtists: { limit: number } };

const itunesSearchConfig = config.get<ItunesSearchConfig>("remote.itunes.search");

export const searchArtists = async (query: string) => {
  const url = new URL(itunesSearchConfig.url);
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "musicArtist");
  url.searchParams.set("limit", String(itunesSearchConfig.searchArtists.limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("An error ocurred while searching for artists", { cause: response.status });
  }

  return (await response.json()) as ItunesResponseModel<ItunesArtistSearchModel>;
};
