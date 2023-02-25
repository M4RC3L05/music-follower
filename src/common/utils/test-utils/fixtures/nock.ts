import config from "config";
import nock from "nock";

export const getLatestsArtistMusicReleases = (status: number, body: any, id: string | number) => {
  nock(config.get("remote.itunes.lookup.url"))
    .get(/.*/)
    .query({
      id,
      entity: "song",
      media: "music",
      sort: "recent",
      limit: config.get("remote.itunes.lookup.getLatestsArtistMusicReleases.limit"),
    })
    .reply(status, body);
};

export const getLatestsArtistAlbumReleases = (status: number, body: any, id: string | number) => {
  nock(config.get("remote.itunes.lookup.url"))
    .get(/.*/)
    .query({
      id,
      entity: "album",
      media: "music",
      sort: "recent",
      limit: config.get("remote.itunes.lookup.getLatestsArtistAlbumReleases.limit"),
    })
    .reply(status, body);
};

export const getAppleMusicArtistPage = (status: number, url: string, body: any) => {
  nock(url).get(/.*/).reply(status, body);
};

export const searchArtists = (status: number, body: any, term: string) => {
  nock(config.get("remote.itunes.search.url"))
    .get(/.*/)
    .query({ term, entity: "musicArtist", limit: config.get("remote.itunes.search.searchArtists.limit") })
    .reply(status, body);
};
