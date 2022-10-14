import config from "config";
import nock from "nock";

export function getLatestsArtistMusicReleases(status: number, body: any) {
  nock(config.get("remote.itunes.lookup.url")).get(/.*/).reply(status, body);
}

export function getLatestsArtistAlbumReleases(status: number, body: any) {
  nock(config.get("remote.itunes.lookup.url")).get(/.*/).reply(status, body);
}
