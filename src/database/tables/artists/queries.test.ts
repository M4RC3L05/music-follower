import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";

import { add, deleteById, getAll, getById, searchPaginated } from "#src/database/tables/artists/queries.js";
import { artistFixtures } from "#src/utils/tests/fixtures/index.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";

describe("queries", () => {
  describe("getById()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should return undefined if no artist was found", () => {
      assert.strict.equal(getById(1), undefined);
    });

    it("should return the request artist", () => {
      artistFixtures.loadArtist({ id: 1 });
      artistFixtures.loadArtist({ id: 2 });

      assert.strict.equal(getById(1)!.id, 1);
    });
  });

  describe("getAll()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should return empty array if no artists", () => {
      assert.strict.deepEqual(getAll(), []);
    });

    it("should return all artists", () => {
      artistFixtures.loadArtist({ id: 1 });
      artistFixtures.loadArtist({ id: 2 });

      assert.strict.deepEqual(
        getAll().map(({ id }) => ({ id })),
        [{ id: 1 }, { id: 2 }],
      );
    });
  });

  describe("searchPaginated()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should return no artists if there is no artists", () => {
      assert.strict.deepEqual(searchPaginated(), { data: [], total: 0 });
    });

    it("should return artists paginated", () => {
      artistFixtures.loadArtist({ id: 1 });
      artistFixtures.loadArtist({ id: 2 });
      artistFixtures.loadArtist({ id: 3 });

      const { data, total } = searchPaginated({ page: 1, limit: 2 });

      assert.strict.deepEqual({ data: data.map(({ id }) => ({ id })), total }, { data: [{ id: 3 }], total: 3 });
    });

    it("should search for artists name", () => {
      artistFixtures.loadArtist({ id: 1, name: "foo" });
      artistFixtures.loadArtist({ id: 2, name: "bar" });
      artistFixtures.loadArtist({ id: 3, name: "fox" });

      const { data, total } = searchPaginated({ q: "fo" });

      assert.strict.deepEqual(
        { data: data.map(({ id }) => ({ id })), total },
        { data: [{ id: 1 }, { id: 3 }], total: 2 },
      );
    });
  });

  describe("add()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should add an artist", () => {
      assert.strict.deepEqual(add({ id: 1, imageUrl: "foo", name: "bar" }), { changes: 1, lastInsertRowid: 1 });
    });
  });

  describe("deleteById()", () => {
    beforeEach(() => {
      databaseHooks.cleanup();
    });

    it("should ignore if no artists to delete", () => {
      assert.strict.deepEqual(deleteById(1), { changes: 0, lastInsertRowid: 1 });
    });

    it("should delete a artist by id", () => {
      artistFixtures.loadArtist({ id: 1 });
      artistFixtures.loadArtist({ id: 3 });

      assert.strict.deepEqual(deleteById(1), { changes: 1, lastInsertRowid: 2 });
      assert.strict.deepEqual(getById(3)!.id, 3);
      assert.strict.deepEqual(getById(1), undefined);
    });
  });
});
