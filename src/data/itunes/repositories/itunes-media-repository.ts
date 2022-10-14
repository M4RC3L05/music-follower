import appleMusicMediaRemote from "#src/data/itunes/remotes/apple-music-media-remote.js";

class ItunesMediaRepository {
  async getArtistsImage(appleMusicArtistUrl: string) {
    return appleMusicMediaRemote.getArtistImage(appleMusicArtistUrl);
  }
}

export default new ItunesMediaRepository();
