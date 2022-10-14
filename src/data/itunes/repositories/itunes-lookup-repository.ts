import itunesLookupRemote from "#src/data/itunes/remotes/itunes-lookup-remote.js";

class ItunesLookupRepository {
  async getAllLatestReleasesFromArtist(artistId: number) {
    return Promise.allSettled([
      itunesLookupRemote.getLatestsArtistMusicReleases(artistId),
      itunesLookupRemote.getLatestsArtistAlbumReleases(artistId),
    ]);
  }
}

export default new ItunesLookupRepository();
