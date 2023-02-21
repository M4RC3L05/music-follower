import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import sql from "@leafac/sqlite";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { type Release, releases } from "#src/database/mod.js";
import { getById } from "./get-by-id.js";
import { upsertMany } from "./upsert-many.js";

const makeReleaseObject = (
  data: Partial<Release> = {},
  extra: { collectionId?: number; isStreamable?: boolean; feedAt?: Date } = {},
): Omit<Release, "feedAt"> & { collectionId?: number; isStreamable?: boolean; feedAt?: Date } => ({
  artistName: "foo",
  coverUrl: "http://foo.bix",
  feedAt: new Date(),
  id: 1,
  metadata: {},
  name: "bar",
  releasedAt: new Date(),
  type: "collection",
  ...data,
  ...extra,
});

describe("upsertMany()", () => {
  beforeAll(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    hooks.database.cleanup();
  });

  describe("feedAt", () => {
    beforeEach(() => {
      hooks.database.cleanup();
    });

    it("should use the feedAt of the provided release data", () => {
      const feedAt = new Date(0);
      const release = makeReleaseObject({}, { feedAt });

      upsertMany([release]);
      expect(getById(release.id, "collection")?.feedAt?.toISOString()).toBe(feedAt.toISOString());
    });

    it("should use the previously stored feedAt if none provided", () => {
      const feedAt = new Date(0);

      fixtures.releases.load({ id: 1, type: "collection", feedAt });

      upsertMany([makeReleaseObject({ id: 1, type: "collection" }, { feedAt: undefined })]);
      expect(getById(1, "collection")?.feedAt?.toISOString()).toBe(feedAt.toISOString());
    });

    it("should use the releasedAt as the feedAt if it is released in the future and no release exists", () => {
      const releasedAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

      upsertMany([makeReleaseObject({ releasedAt }, { feedAt: undefined })]);

      expect(getById(1, "collection")?.feedAt?.toISOString()).toBe(releasedAt.toISOString());
    });

    it("should use the current date if it was already released and no release exists", () => {
      vi.useFakeTimers({ now: 0 });

      const releasedAt = new Date(Date.now() - 1000 * 60 * 60 * 24);

      upsertMany([makeReleaseObject({ releasedAt }, { feedAt: undefined })]);

      expect(getById(1, "collection")?.feedAt?.toISOString()).toBe(new Date().toISOString());
    });
  });

  describe("collection type", () => {
    beforeEach(() => {
      hooks.database.cleanup();
    });

    it("should create a release if non exists", () => {
      const release = makeReleaseObject({ metadata: { foo: 1 } });

      upsertMany([release]);

      const releaseStored = getById(release.id, "collection");

      expect({ id: releaseStored?.id, metadata: releaseStored?.metadata }).toEqual({
        id: release.id,
        metadata: release.metadata,
      });
    });

    it("should update a release if one already exists", () => {
      const release = makeReleaseObject({ id: 1, type: "collection", name: "foo" });

      fixtures.releases.load({ id: 1, type: "collection", name: "bar" });

      expect(getById(release.id, "collection")?.name).toBe("bar");
      upsertMany([release]);

      const releaseStored = getById(release.id, "collection");

      expect({ id: releaseStored?.id, metadata: releaseStored?.metadata, name: releaseStored?.name }).toEqual({
        id: release.id,
        metadata: release.metadata,
        name: "foo",
      });

      expect(releases.table.all(sql`select * from $${releases.table.lit("table")}`)).toHaveLength(1);
    });
  });

  describe("track type", () => {
    beforeEach(() => {
      hooks.database.cleanup();
    });

    it("should ignore release if it is not streamable", () => {
      const release = makeReleaseObject({ id: 1, type: "track" }, { isStreamable: false });

      upsertMany([release]);
      expect(getById(release.id, "track")).toBeUndefined();
    });

    it("should ignore release if no collection release exists", () => {
      const release = makeReleaseObject({ id: 1, type: "track" }, { isStreamable: true, collectionId: 1 });

      upsertMany([release]);
      expect(getById(release.id, "track")).toBeUndefined();
    });

    it("should ignore release if the curresponding collection release was already released", () => {
      const releaseTrack = makeReleaseObject({ id: 1, type: "track" }, { isStreamable: true, collectionId: 1 });

      fixtures.releases.load({
        id: 1,
        type: "collection",
        releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      });

      upsertMany([releaseTrack]);
      expect(getById(releaseTrack.id, "track")).toBeUndefined();
    });

    it("should create a release if one does not exist", () => {
      const releaseTrack = makeReleaseObject(
        { id: 1, type: "track", metadata: { foo: true } },
        { isStreamable: true, collectionId: 1 },
      );

      fixtures.releases.load({
        id: 1,
        type: "collection",
        releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      upsertMany([releaseTrack]);

      const release = getById(releaseTrack.id, "track");

      expect({ id: release?.id, metadata: release?.metadata }).toEqual({
        id: releaseTrack.id,
        metadata: { foo: true },
      });
      expect(releases.table.all(sql`select * from $${releases.table.lit("table")}`)).toHaveLength(2);
    });

    it("should use current date as released at if the one provided is invalid", () => {
      vi.useFakeTimers({ now: 0 });

      const releaseTrack = makeReleaseObject(
        { id: 1, type: "track", releasedAt: new Date(undefined!) },
        { isStreamable: true, collectionId: 1 },
      );

      fixtures.releases.load({
        id: 1,
        type: "collection",
        releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      upsertMany([releaseTrack]);

      const release = getById(releaseTrack.id, "track");

      expect({ id: release?.id, releasedAt: release?.releasedAt }).toEqual({
        id: releaseTrack.id,
        releasedAt: new Date(),
      });
      expect(releases.table.all(sql`select * from $${releases.table.lit("table")}`)).toHaveLength(2);
    });

    it("should use the released at of the db record as released at if the one provided is invalid and a release record exists on the db", () => {
      vi.useFakeTimers({ now: 0 });

      const releaseTrack = makeReleaseObject(
        { id: 1, type: "track", releasedAt: new Date(undefined!) },
        { isStreamable: true, collectionId: 1 },
      );

      fixtures.releases.load({ id: 1, type: "track", releasedAt: new Date(10) });
      fixtures.releases.load({
        id: 1,
        type: "collection",
        releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      upsertMany([releaseTrack]);

      const release = getById(releaseTrack.id, "track");

      expect({ id: release?.id, releasedAt: release?.releasedAt }).toEqual({
        id: releaseTrack.id,
        releasedAt: new Date(10),
      });
      expect(releases.table.all(sql`select * from $${releases.table.lit("table")}`)).toHaveLength(2);
    });

    it("should update a release if one already exist", () => {
      const releaseTrack = makeReleaseObject(
        { id: 1, type: "track", name: "bar", metadata: { foo: true } },
        { isStreamable: true, collectionId: 1 },
      );

      fixtures.releases.load({
        id: 1,
        type: "collection",
        releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });
      fixtures.releases.load({ id: 1, type: "track", name: "foo" });

      expect(getById(releaseTrack.id, "track")?.name).toBe("foo");
      upsertMany([releaseTrack]);

      const release = getById(releaseTrack.id, "track");

      expect({ id: release?.id, metadata: release?.metadata, name: release?.name }).toEqual({
        id: releaseTrack.id,
        metadata: { foo: true },
        name: "bar",
      });
      expect(releases.table.all(sql`select * from $${releases.table.lit("table")}`)).toHaveLength(2);
    });
  });
});
