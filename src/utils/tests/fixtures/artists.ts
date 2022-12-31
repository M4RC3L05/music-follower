import { type Artist, artistQueries } from "#src/database/tables/artists/index.js";

export const loadArtist = (data: Partial<Artist> = {}) =>
  artistQueries.add({ id: 1, name: "foo", imageUrl: "http://foo.bix", ...data });
