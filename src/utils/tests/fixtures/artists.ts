import { artists } from "#src/database/index.js";
import { type Artist } from "#src/database/artists/index.js";

export const loadArtist = (data: Partial<Artist> = {}) =>
  artists.queries.create({ id: 1, name: "foo", imageUrl: "http://foo.bix", ...data });
