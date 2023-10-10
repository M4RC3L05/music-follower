import config from "config";

import { type ItunesLookupAlbumModel, type ItunesLookupSongModel, type ItunesResponseModel } from "../types.js";
import { request } from "#src/common/utils/fetch-utils.js";

const itunesLookupConfig = config.get<ItunesLookupConfig>("remote.itunes.lookup");

type ItunesLookupConfig = {
  url: string;
  getLatestsArtistMusicReleases: { limit: number };
  getLatestsArtistAlbumReleases: { limit: number };
};

export const getLatestReleasesByArtist = async <E extends "song" | "album">(
  artistId: number,
  entity: E,
  signal?: AbortSignal,
): Promise<
  ItunesResponseModel<E extends "song" ? ItunesLookupSongModel : E extends "album" ? ItunesLookupAlbumModel : never>
> => {
  const path = new URL(itunesLookupConfig.url);
  path.searchParams.set("id", String(artistId));
  path.searchParams.set("entity", entity);
  path.searchParams.set("media", "music");
  path.searchParams.set("sort", "recent");
  path.searchParams.set(
    "limit",
    String(
      entity === "song"
        ? itunesLookupConfig.getLatestsArtistMusicReleases.limit
        : itunesLookupConfig.getLatestsArtistAlbumReleases.limit,
    ),
  );

  const response = await request(path.toString(), { signal }, { retryN: 1 });

  if (!response.ok) {
    throw new Error("Error requesting lookup artists releases", { cause: response.status });
  }

  const data = (await response.json()) as ItunesResponseModel<
    E extends "song" ? ItunesLookupSongModel : E extends "album" ? ItunesLookupAlbumModel : never
  >;

  // Remove artists info from results
  data.results.splice(0, 1);

  return data;
};
