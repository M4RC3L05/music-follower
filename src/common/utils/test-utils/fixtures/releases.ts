import { type Release, releasesQueries } from "#src/domain/releases/mod.js";

export const load = (data: Partial<Release> = {}) => {
  return releasesQueries.create({
    artistName: "foo",
    coverUrl: "http://foo.bix",
    feedAt: new Date(),
    id: 1,
    metadata: {},
    name: "bar",
    releasedAt: new Date(),
    type: "track",
    ...data,
  });
};
