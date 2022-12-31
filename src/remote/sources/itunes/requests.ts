import config from "config";
import fetch from "node-fetch";

import {
  type ItunesArtistSearchModel,
  type ItunesLookupAlbumModel,
  type ItunesLookupSongModel,
  type ItunesResponseModel,
} from "#src/remote/sources/itunes/types.js";

type ItunesLookupConfig = {
  url: string;
  getLatestsArtistMusicReleases: { limit: number };
  getLatestsArtistAlbumReleases: { limit: number };
};
type ItunesSearchConfig = { url: string; searchArtists: { limit: number } };

const itunesSearchConfig = config.get<ItunesSearchConfig>("remote.itunes.search");
const itunesLookupConfig = config.get<ItunesLookupConfig>("remote.itunes.lookup");

export const getLatestsArtistMusicReleases = async (artistId: number) => {
  const url = new URL(itunesLookupConfig.url);

  url.searchParams.append("id", String(artistId));
  url.searchParams.append("entity", "song");
  url.searchParams.append("media", "music");
  url.searchParams.append("sort", "recent");
  url.searchParams.append("limit", String(itunesLookupConfig.getLatestsArtistMusicReleases.limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Error requesting lookup artists music releases", { cause: response.status });
  }

  const data = (await response.json()) as ItunesResponseModel<ItunesLookupSongModel>;

  // Remove artists info from results
  data.results.splice(0, 1);

  return data;
};

export const getLatestsArtistAlbumReleases = async (artistId: number) => {
  const url = new URL(itunesLookupConfig.url);

  url.searchParams.append("id", String(artistId));
  url.searchParams.append("entity", "album");
  url.searchParams.append("media", "music");
  url.searchParams.append("sort", "recent");
  url.searchParams.append("limit", String(itunesLookupConfig.getLatestsArtistAlbumReleases.limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("Error requesting lookup artists album releases", { cause: response.status });
  }

  const data = (await response.json()) as ItunesResponseModel<ItunesLookupAlbumModel>;

  // Remove artists info from results
  data.results.splice(0, 1);

  return data;
};

export const searchArtists = async (query: string) => {
  const url = new URL(itunesSearchConfig.url);
  url.searchParams.append("term", query);
  url.searchParams.append("entity", "musicArtist");
  url.searchParams.append("limit", String(itunesSearchConfig.searchArtists.limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error("An error ocurred while searching for artists", { cause: response.status });
  }

  return (await response.json()) as ItunesResponseModel<ItunesArtistSearchModel>;
};
