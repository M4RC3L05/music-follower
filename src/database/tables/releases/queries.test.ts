/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";

import sql from "@leafac/sqlite";
import sinon from "sinon";

import { add, getById, getLatests, searchPaginated, upsertMany } from "#src/database/tables/releases/queries.js";
import table from "#src/database/tables/releases/table.js";
import { type Release } from "#src/database/tables/releases/types.js";
import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";

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

describe("queries", () => {
  describe("getLatests()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should return empty array if no releases", () => {
      assert.strict.deepEqual(getLatests(), []);
    });

    it("should not include releases after today", () => {
      releaseFixtures.loadRelease({ id: 1, releasedAt: new Date(), feedAt: new Date(1000) });
      releaseFixtures.loadRelease({ id: 2, releasedAt: new Date(Date.now() - 1000 * 60), feedAt: new Date(500) });
      releaseFixtures.loadRelease({ id: 3, releasedAt: new Date(Date.now() - 1000 * 60 * 60), feedAt: new Date(500) });
      releaseFixtures.loadRelease({
        id: 4,
        releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        feedAt: new Date(0),
      });

      assert.strict.deepEqual(
        getLatests().map(({ id }) => ({ id })),
        [{ id: 1 }, { id: 2 }, { id: 3 }],
      );
    });

    it("should return the latest releases in the correct order", () => {
      releaseFixtures.loadRelease({ id: 1, feedAt: new Date(500) });
      releaseFixtures.loadRelease({ id: 2, feedAt: new Date(0) });
      releaseFixtures.loadRelease({ id: 3, feedAt: new Date(1000) });

      assert.strict.deepEqual(
        getLatests().map(({ id }) => ({ id })),
        [{ id: 3 }, { id: 1 }, { id: 2 }],
      );
    });

    it("shoould allow to set the max number of releases to retrieve", () => {
      releaseFixtures.loadRelease({ id: 1, feedAt: new Date(1000) });
      releaseFixtures.loadRelease({ id: 2, feedAt: new Date(500) });
      releaseFixtures.loadRelease({ id: 3, feedAt: new Date(0) });

      assert.strict.deepEqual(
        getLatests(2).map(({ id }) => ({ id })),
        [{ id: 1 }, { id: 2 }],
      );
    });
  });

  describe("upsertMany()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    describe("feedAt", () => {
      beforeEach(() => {
        databaseHooks.cleanup();
      });

      it("should use the feedAt of the provided release data", () => {
        const feedAt = new Date(0);
        const release = makeReleaseObject({}, { feedAt });

        upsertMany([release]);
        assert.strict.equal(getById(release.id, "collection")?.feedAt?.toISOString(), feedAt.toISOString());
      });

      it("should use the previously stored feedAt if none provided", () => {
        const feedAt = new Date(0);

        releaseFixtures.loadRelease({ id: 1, type: "collection", feedAt });

        upsertMany([makeReleaseObject({ id: 1, type: "collection" }, { feedAt: undefined })]);
        assert.strict.equal(getById(1, "collection")?.feedAt?.toISOString(), feedAt.toISOString());
      });

      it("should use the releasedAt as the feedAt if it is released in the future and no release exists", () => {
        const releasedAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

        upsertMany([makeReleaseObject({ releasedAt }, { feedAt: undefined })]);

        assert.strict.equal(getById(1, "collection")?.feedAt?.toISOString(), releasedAt.toISOString());
      });

      it("should use the current date if it was already released and no release exists", () => {
        sinon.useFakeTimers(0);

        const releasedAt = new Date(Date.now() - 1000 * 60 * 60 * 24);

        upsertMany([makeReleaseObject({ releasedAt }, { feedAt: undefined })]);

        assert.strict.equal(getById(1, "collection")?.feedAt?.toISOString(), new Date().toISOString());

        sinon.reset();
        sinon.restore();
      });
    });

    describe("collection type", () => {
      beforeEach(() => {
        databaseHooks.cleanup();
      });

      it("should create a release if non exists", () => {
        const release = makeReleaseObject({ metadata: { foo: 1 } });

        upsertMany([release]);

        const releaseStored = getById(release.id, "collection");

        assert.strict.deepEqual(
          { id: releaseStored?.id, metadata: releaseStored?.metadata },
          { id: release.id, metadata: release.metadata },
        );
      });

      it("should update a release if one already exists", () => {
        const release = makeReleaseObject({ id: 1, type: "collection", name: "foo" });

        releaseFixtures.loadRelease({ id: 1, type: "collection", name: "bar" });

        assert.strict.equal(getById(release.id, "collection")?.name, "bar");
        upsertMany([release]);

        const releaseStored = getById(release.id, "collection");

        assert.strict.deepEqual(
          { id: releaseStored?.id, metadata: releaseStored?.metadata, name: releaseStored?.name },
          { id: release.id, metadata: release.metadata, name: "foo" },
        );

        assert.strict.equal(table.all(sql`select * from $${table.lit("table")}`).length, 1);
      });
    });

    describe("track type", () => {
      beforeEach(() => {
        databaseHooks.cleanup();
      });

      it("should ignore release if it is not streamable", () => {
        const release = makeReleaseObject({ id: 1, type: "track" }, { isStreamable: false });

        upsertMany([release]);
        assert.strict.equal(getById(release.id, "track"), undefined);
      });

      it("should ignore release if no collection release exists", () => {
        const release = makeReleaseObject({ id: 1, type: "track" }, { isStreamable: true, collectionId: 1 });

        upsertMany([release]);
        assert.strict.equal(getById(release.id, "track"), undefined);
      });

      it("should ignore release if the curresponding collection release was already released", () => {
        const releaseTrack = makeReleaseObject({ id: 1, type: "track" }, { isStreamable: true, collectionId: 1 });

        releaseFixtures.loadRelease({
          id: 1,
          type: "collection",
          releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        });

        upsertMany([releaseTrack]);
        assert.strict.equal(getById(releaseTrack.id, "track"), undefined);
      });

      it("should create a release if one does not exist", () => {
        const releaseTrack = makeReleaseObject(
          { id: 1, type: "track", metadata: { foo: true } },
          { isStreamable: true, collectionId: 1 },
        );

        releaseFixtures.loadRelease({
          id: 1,
          type: "collection",
          releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        upsertMany([releaseTrack]);

        const release = getById(releaseTrack.id, "track");

        assert.strict.deepEqual(
          { id: release?.id, metadata: release?.metadata },
          { id: releaseTrack.id, metadata: { foo: true } },
        );
        assert.strict.equal(table.all(sql`select * from $${table.lit("table")}`).length, 2);
      });

      it("should use current date as released at if the one provided is invalid", () => {
        sinon.useFakeTimers(0);

        const releaseTrack = makeReleaseObject(
          { id: 1, type: "track", releasedAt: new Date(undefined!) },
          { isStreamable: true, collectionId: 1 },
        );

        releaseFixtures.loadRelease({
          id: 1,
          type: "collection",
          releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        upsertMany([releaseTrack]);

        const release = getById(releaseTrack.id, "track");

        assert.strict.deepEqual(
          { id: release?.id, releasedAt: release?.releasedAt },
          { id: releaseTrack.id, releasedAt: new Date() },
        );
        assert.strict.equal(table.all(sql`select * from $${table.lit("table")}`).length, 2);

        sinon.restore();
        sinon.reset();
      });

      it("should use the released at of the db record as released at if the one provided is invalid and a release record exists on the db", () => {
        sinon.useFakeTimers(0);

        const releaseTrack = makeReleaseObject(
          { id: 1, type: "track", releasedAt: new Date(undefined!) },
          { isStreamable: true, collectionId: 1 },
        );

        releaseFixtures.loadRelease({ id: 1, type: "track", releasedAt: new Date(10) });
        releaseFixtures.loadRelease({
          id: 1,
          type: "collection",
          releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });

        upsertMany([releaseTrack]);

        const release = getById(releaseTrack.id, "track");

        assert.strict.deepEqual(
          { id: release?.id, releasedAt: release?.releasedAt },
          { id: releaseTrack.id, releasedAt: new Date(10) },
        );
        assert.strict.equal(table.all(sql`select * from $${table.lit("table")}`).length, 2);

        sinon.restore();
        sinon.reset();
      });

      it("should update a release if one already exist", () => {
        const releaseTrack = makeReleaseObject(
          { id: 1, type: "track", name: "bar", metadata: { foo: true } },
          { isStreamable: true, collectionId: 1 },
        );

        releaseFixtures.loadRelease({
          id: 1,
          type: "collection",
          releasedAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        releaseFixtures.loadRelease({ id: 1, type: "track", name: "foo" });

        assert.strict.equal(getById(releaseTrack.id, "track")?.name, "foo");
        upsertMany([releaseTrack]);

        const release = getById(releaseTrack.id, "track");

        assert.strict.deepEqual(
          { id: release?.id, metadata: release?.metadata, name: release?.name },
          { id: releaseTrack.id, metadata: { foo: true }, name: "bar" },
        );
        assert.strict.equal(table.all(sql`select * from $${table.lit("table")}`).length, 2);
      });
    });
  });

  describe("searchPaginated()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should return no releases if there is no releases", () => {
      assert.strict.deepEqual(searchPaginated(), { data: [], total: 0 });
    });

    it("should return releases paginated", () => {
      releaseFixtures.loadRelease({ id: 1, releasedAt: new Date(1000) });
      releaseFixtures.loadRelease({ id: 2, releasedAt: new Date(500) });
      releaseFixtures.loadRelease({ id: 3, releasedAt: new Date(0) });

      const { data, total } = searchPaginated({ page: 1, limit: 2 });

      assert.strict.deepEqual({ data: data.map(({ id }) => ({ id })), total }, { data: [{ id: 3 }], total: 3 });
    });

    it("should search for releases name and artistName", () => {
      releaseFixtures.loadRelease({ id: 1, releasedAt: new Date(1000), name: "foo", artistName: "x" });
      releaseFixtures.loadRelease({ id: 2, releasedAt: new Date(500), name: "bar", artistName: "foobar" });
      releaseFixtures.loadRelease({ id: 3, releasedAt: new Date(250), name: "fox", artistName: "bar" });
      releaseFixtures.loadRelease({ id: 4, releasedAt: new Date(0), name: "qix", artistName: "qux" });

      const { data, total } = searchPaginated({ q: "fo" });

      assert.strict.deepEqual(
        { data: data.map(({ id }) => ({ id })), total },
        { data: [{ id: 1 }, { id: 2 }, { id: 3 }], total: 3 },
      );
    });
  });

  describe("add()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should add a release", () => {
      assert.strict.deepEqual(
        add({
          artistName: "foo",
          coverUrl: "bar",
          feedAt: new Date(),
          id: 1,
          metadata: {},
          name: "bax",
          releasedAt: new Date(),
          type: "track",
        }),
        { changes: 1, lastInsertRowid: 1 },
      );
      assert.strict.equal(getById(1, "track")?.id, 1);
    });
  });
});
