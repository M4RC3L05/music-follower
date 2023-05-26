import { type Artist, artistQueries } from "#src/domain/artists/mod.js";

export const load = (data: Partial<Artist> = {}) => {
  return artistQueries.create({ id: 1, name: "foo", imageUrl: "http://foo.bix", ...data });
};
