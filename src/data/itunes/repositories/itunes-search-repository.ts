import itunesSearchRemote from "#src/data/itunes/remotes/itunes-search-remote.js";

class ItunesSearchRepository {
  async searchArtists(term: string) {
    return itunesSearchRemote.searchArtists(term);
  }
}

export default new ItunesSearchRepository();
