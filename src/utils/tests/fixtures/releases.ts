import { type Release, releaseQueries } from "#src/database/tables/releases/index.js";

export const loadRelease = (data: Partial<Release> = {}) =>
  releaseQueries.add({
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
