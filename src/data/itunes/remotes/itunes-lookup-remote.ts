import config from "config";
import fetch from "node-fetch";

import type { ItunesLookupAlbumModel } from "#src/data/itunes/models/itunes-lookup-album-model.js";
import type { ItunesLookupSongModel } from "#src/data/itunes/models/itunes-lookup-song-model.js";
import type { ItunesResponseModel } from "#src/data/itunes/models/itunes-response-model.js";

type ItunesLookupConfig = {
  url: string;
  getLatestsArtistMusicReleases: {
    limit: number;
  };
  getLatestsArtistAlbumReleases: {
    limit: number;
  };
};

class ItunesLookupRemote {
  #itunesLookupConfig = config.get<ItunesLookupConfig>("remote.itunes.lookup");

  async getLatestsArtistMusicReleases(artistId: number) {
    const url = new URL(this.#itunesLookupConfig.url);

    url.searchParams.append("id", String(artistId));
    url.searchParams.append("entity", "song");
    url.searchParams.append("media", "music");
    url.searchParams.append("sort", "recent");
    url.searchParams.append("limit", String(this.#itunesLookupConfig.getLatestsArtistMusicReleases.limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Error requesting lookup artists music releases", { cause: response.status });
    }

    const data = (await response.json()) as ItunesResponseModel<ItunesLookupSongModel>;

    // Remove artists info from results
    data.results.splice(0, 1);

    return data;
  }

  async getLatestsArtistAlbumReleases(artistId: number) {
    const url = new URL(this.#itunesLookupConfig.url);

    url.searchParams.append("id", String(artistId));
    url.searchParams.append("entity", "album");
    url.searchParams.append("media", "music");
    url.searchParams.append("sort", "recent");
    url.searchParams.append("limit", String(this.#itunesLookupConfig.getLatestsArtistAlbumReleases.limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Error requesting lookup artists album releases", { cause: response.status });
    }

    const data = (await response.json()) as ItunesResponseModel<ItunesLookupAlbumModel>;

    // Remove artists info from results
    data.results.splice(0, 1);

    return data;
  }
}

export default new ItunesLookupRemote();
