/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import { before, beforeEach, describe, it } from "node:test";

import sql from "@leafac/sqlite";
import sinon from "sinon";

import { releases } from "#src/database/index.js";
import { type Release } from "#src/database/releases/types.js";
import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { upsertMany } from "./upsert-many.js";
import { getById } from "./get-by-id.js";

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
  before(async () => {
    await databaseHooks.migrate();
  });

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

      assert.strict.equal(releases.table.all(sql`select * from $${releases.table.lit("table")}`).length, 1);
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
      assert.strict.equal(releases.table.all(sql`select * from $${releases.table.lit("table")}`).length, 2);
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
      assert.strict.equal(releases.table.all(sql`select * from $${releases.table.lit("table")}`).length, 2);

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
      assert.strict.equal(releases.table.all(sql`select * from $${releases.table.lit("table")}`).length, 2);

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
      assert.strict.equal(releases.table.all(sql`select * from $${releases.table.lit("table")}`).length, 2);
    });
  });
});
