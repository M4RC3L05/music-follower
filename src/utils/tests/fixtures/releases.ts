import { releases } from "#src/database/index.js";
import { type Release } from "#src/database/releases/index.js";

export const loadRelease = (data: Partial<Release> = {}) =>
  releases.queries.create({
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
