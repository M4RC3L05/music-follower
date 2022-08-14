import config from "config";
import LRU from "lru-cache";
import fetch from "node-fetch";

import { makeLogger } from "#src/core/clients/logger.js";

export type ItunesArtistSearchResult = {
  wrapperType: string;
  artistType: string;
  artistName: string;
  artistLinkUrl: string;
  artistId: number;
  amgArtistId: number;
  primaryGenreName: string;
  primaryGenreId: number;
};

const logger = makeLogger("itunes-search-service");

class ItunesSearchService {
  #cache = new LRU({ max: 10_000, ttl: 1000 * 60 * 30 });

  async searchArtists(query: string) {
    logger.info({ query }, "Searching artists");

    if (!this.#cache.has(query)) {
      logger.info({ query }, "Not in cache, performing search request");

      const { searchUrl } = config.get<{ searchUrl: string }>("itunes");
      const url = new URL(searchUrl);
      url.searchParams.append("term", query);
      url.searchParams.append("entity", "musicArtist");
      url.searchParams.append("limit", "5");

      const response = await fetch(url.toString());

      if (!response.ok) {
        logger.error({ status: response.status }, "Could not fetch artists from itunes");

        throw new Error("An error ocurred while searching for artists");
      }

      const result = await response.json();

      this.#cache.set(query, (result as any)?.results ?? []);
    }

    return this.#cache.get(query);
  }
}

export const itunesSearchService = new ItunesSearchService();
