import { inspect } from "node:util";

import { describe, expect, jest, test } from "@jest/globals";

import type { ItunesLookupAlbumModel } from "#src/data/itunes/models/itunes-lookup-album-model.js";
import type { ItunesLookupSongModel } from "#src/data/itunes/models/itunes-lookup-song-model.js";
import { ReleaseModel } from "#src/data/release/models/release-model.js";
import releaseRepository from "#src/data/release/repositories/release-repository.js";
import * as fixtures from "#tests/fixtures/index.js";

describe("ReleaseRepository", () => {
  describe("upsertReleases", () => {
    test("it should skip if it is not streamable", async () => {
      const songRelease = fixtures.loadItunesLookupSong({ isStreamable: false });

      jest.spyOn(ReleaseModel, "query");

      await releaseRepository.upsertReleases(1, [
        {
          feedAt: new Date(songRelease.releaseDate!),
          artistName: "foobar",
          id: 123,
          isStreamable: songRelease.isStreamable,
          metadata: songRelease as ItunesLookupSongModel | ItunesLookupAlbumModel,
          type: "track",
          collectionId: 1,
          coverUrl: "foo",
          name: "bar",
          releasedAt: new Date(songRelease.releaseDate!),
        },
      ]);

      expect(ReleaseModel.query).toHaveBeenCalledTimes(0);
      expect(await ReleaseModel.query().where({ id: 123 }).first()).toBeUndefined();
    });

    test("it should skip if song release does not have the corresponding album release", async () => {
      const songRelease = fixtures.loadItunesLookupSong();

      jest.spyOn(ReleaseModel, "query");

      await releaseRepository.upsertReleases(1, [
        {
          feedAt: new Date(songRelease.releaseDate!),
          artistName: "foobar",
          id: 123,
          isStreamable: songRelease.isStreamable,
          metadata: songRelease as ItunesLookupSongModel | ItunesLookupAlbumModel,
          type: "track",
          collectionId: 1,
          coverUrl: "foo",
          name: "bar",
          releasedAt: new Date(songRelease.releaseDate!),
        },
      ]);

      expect(ReleaseModel.query).toHaveBeenCalledTimes(1);
      expect(await ReleaseModel.query().where({ id: 123 }).first()).toBeUndefined();
    });

    test("it should skip if song release is a pre release", async () => {
      const releasedAt = new Date();
      releasedAt.setUTCFullYear(releasedAt.getUTCFullYear() - 1);
      await fixtures.loadRelease({
        feedAt: releasedAt,
        artistName: "foo",
        coverUrl: "bar",
        id: 2,
        name: "biz",
        releasedAt,
        type: "collection",
      });
      const songRelease = fixtures.loadItunesLookupSong({ releaseDate: new Date().toISOString() });

      jest.spyOn(ReleaseModel, "query");

      await releaseRepository.upsertReleases(1, [
        {
          feedAt: new Date(songRelease.releaseDate!),
          artistName: "foobar",
          id: 123,
          isStreamable: songRelease.isStreamable,
          metadata: songRelease as ItunesLookupSongModel | ItunesLookupAlbumModel,
          type: "track",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt: new Date(songRelease.releaseDate!),
        },
      ]);

      expect(ReleaseModel.query).toHaveBeenCalledTimes(1);
      expect(await ReleaseModel.query().where({ id: 123 }).first()).toBeUndefined();
    });

    test("it should upsert song release", async () => {
      const releasedAt = new Date();
      releasedAt.setUTCFullYear(releasedAt.getUTCFullYear() + 1);
      await fixtures.loadRelease({
        feedAt: releasedAt,
        artistName: "foo",
        coverUrl: "bar",
        id: 2,
        name: "biz",
        releasedAt,
        type: "collection",
      });
      const songRelease = fixtures.loadItunesLookupSong({ releaseDate: new Date().toISOString() });

      await releaseRepository.upsertReleases(1, [
        {
          feedAt: new Date(songRelease.releaseDate!),
          artistName: "foobar",
          id: 123,
          isStreamable: songRelease.isStreamable,
          metadata: songRelease as ItunesLookupSongModel | ItunesLookupAlbumModel,
          type: "track",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt: new Date(songRelease.releaseDate!),
        },
      ]);

      // eslint-disable-next-line unicorn/no-await-expression-member
      expect((await ReleaseModel.query().where({ id: 123 }).first())?.toJSON()).toBeTruthy();
    });

    test("it should upsert album release", async () => {
      await releaseRepository.upsertReleases(1, [
        {
          artistName: "foobar",
          id: 123,
          isStreamable: true,
          // @ts-expect-error empty object
          metadata: {},
          type: "collection",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt: new Date(),
        },
      ]);

      // eslint-disable-next-line unicorn/no-await-expression-member
      expect((await ReleaseModel.query().where({ id: 123 }).first())?.toJSON()).toBeTruthy();
    });

    test("it should use `feedAt` provided by default", async () => {
      await releaseRepository.upsertReleases(1, [
        {
          feedAt: new Date(0),
          artistName: "foobar",
          id: 123,
          isStreamable: true,
          // @ts-expect-error empty object
          metadata: {},
          type: "collection",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt: new Date(),
        },
      ]);

      const release = await ReleaseModel.query().where({ id: 123 }).first();
      expect(release?.toJSON()).toBeTruthy();
      expect(release?.feedAt.toISOString()).toBe(new Date(0).toISOString());
    });

    test("it should use the `releasedAt` for `feedAt` if it is a pre release", async () => {
      const releasedAt = new Date(Date.now() + 10_000);

      await releaseRepository.upsertReleases(1, [
        {
          artistName: "foobar",
          id: 123,
          isStreamable: true,
          // @ts-expect-error empty object
          metadata: {},
          type: "collection",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt,
        },
      ]);

      const release = await ReleaseModel.query().where({ id: 123 }).first();
      expect(release?.toJSON()).toBeTruthy();
      expect(release?.feedAt.toISOString()).toBe(releasedAt.toISOString());
    });

    test("it should use the time as it was processed for the `feedAt`", async () => {
      const releasedAt = new Date(0);

      await releaseRepository.upsertReleases(1, [
        {
          artistName: "foobar",
          id: 123,
          isStreamable: true,
          // @ts-expect-error empty object
          metadata: {},
          type: "collection",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt,
        },
        {
          artistName: "foobar",
          id: 124,
          isStreamable: true,
          // @ts-expect-error empty object
          metadata: {},
          type: "collection",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt,
        },
        {
          artistName: "foobar",
          id: 125,
          isStreamable: true,
          // @ts-expect-error empty object
          metadata: {},
          type: "collection",
          collectionId: 2,
          coverUrl: "foo",
          name: "bar",
          releasedAt,
        },
      ]);

      const releases = await ReleaseModel.query().orderBy("feedAt", "DESC");

      expect(releases).toEqual([
        expect.objectContaining({ id: 125 }),
        expect.objectContaining({ id: 124 }),
        expect.objectContaining({ id: 123 }),
      ]);
      for (const { feedAt } of releases) {
        expect(feedAt.toISOString()).not.toEqual(releasedAt.toISOString());
      }
    });
  });
});
