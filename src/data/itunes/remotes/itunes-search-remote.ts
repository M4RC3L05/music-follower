import config from "config";
import fetch from "node-fetch";

import makeLogger from "#src/core/clients/logger.js";
import type { ItunesArtistSearchModel } from "#src/data/itunes/models/itunes-artists-search-model.js";
import type { ItunesResponseModel } from "#src/data/itunes/models/itunes-response-model.js";

const logger = makeLogger(import.meta.url);

type ItunesSearchConfig = { url: string; searchArtists: { limit: number } };

class ItunesSearchRemote {
  #itunesSearchConfig: ItunesSearchConfig = config.get("remote.itunes.search");

  async searchArtists(query: string) {
    logger.info({ query }, "Searching artists");

    const url = new URL(this.#itunesSearchConfig.url);
    url.searchParams.append("term", query);
    url.searchParams.append("entity", "musicArtist");
    url.searchParams.append("limit", String(this.#itunesSearchConfig.searchArtists.limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      logger.error({ response }, "Could not fetch artists from itunes");

      throw new Error("An error ocurred while searching for artists");
    }

    return (await response.json()) as ItunesResponseModel<ItunesArtistSearchModel>;
  }
}

export default new ItunesSearchRemote();
