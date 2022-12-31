import config from "config";
import nock from "nock";

export const getLatestsArtistMusicReleases = (status: number, body: any) => {
  nock(config.get("remote.itunes.lookup.url")).get(/.*/).reply(status, body);
};

export const getLatestsArtistAlbumReleases = (status: number, body: any) => {
  nock(config.get("remote.itunes.lookup.url")).get(/.*/).reply(status, body);
};

export const getAppleMusicArtistPage = (status: number, url: string, body: any) => {
  nock(url).get(/.*/).reply(status, body);
};

export const searchArtists = (status: number, body: any) => {
  nock(config.get("remote.itunes.search.url")).get(/.*/).reply(status, body);
};
