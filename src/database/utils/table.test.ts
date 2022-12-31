/* eslint-disable @typescript-eslint/restrict-template-expressions */
import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";

import sql from "@leafac/sqlite";

import { db } from "#src/database/db.js";
import { Table } from "#src/database/utils/table.js";

describe("table", () => {
  const t = new (class extends Table<{ foo: string; b: number }> {
    constructor() {
      super(
        { foo: sql`"foo"`, table: sql`"t"`, b: sql`"b"` },
        { foo: (v) => `${v} - todb` },
        { foo: (v) => `${v} - fromdb` },
      );
    }
  })();

  describe("lit()", () => {
    it("should return a literal", () => {
      assert.strict.deepEqual(t.lit("foo"), { parameters: [], sourceParts: ['"foo"'] });
    });
  });

  describe("joinLit()", () => {
    it("should join literals", () => {
      assert.strict.deepEqual(t.joinLit(["foo", "table"], sql`;`), { parameters: [], sourceParts: ['"foo";"t"'] });
    });
  });

  describe("joinValues()", () => {
    it("should join values", () => {
      assert.strict.deepEqual(t.joinValues({ foo: "a", b: 1 }), {
        parameters: ["a - todb", 1],
        sourceParts: ["", ", ", ""],
      });
    });
  });

  describe("set()", () => {
    it("should create set", () => {
      assert.strict.deepEqual(t.set({ foo: "foo", b: 2 }), {
        parameters: ["foo - todb", 2],
        sourceParts: ['"foo" = ', ', "b" = ', ""],
      });
    });
  });

  describe("eq()", () => {
    it("should create a equal", () => {
      assert.strict.deepEqual(t.eq("foo", "bar"), {
        parameters: ["bar - todb"],
        sourceParts: ['"foo" = ', ""],
      });

      assert.strict.deepEqual(t.eq("b", 1), {
        parameters: [1],
        sourceParts: ['"b" = ', ""],
      });

      assert.strict.deepEqual(t.eq("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" = 1'],
      });
    });
  });

  describe("ne()", () => {
    it("should create a not equal", () => {
      assert.strict.deepEqual(t.ne("foo", "bar"), {
        parameters: ["bar - todb"],
        sourceParts: ['"foo" <> ', ""],
      });

      assert.strict.deepEqual(t.ne("b", 1), {
        parameters: [1],
        sourceParts: ['"b" <> ', ""],
      });

      assert.strict.deepEqual(t.ne("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" <> 1'],
      });
    });
  });

  describe("gt()", () => {
    it("should create a greater then", () => {
      assert.strict.deepEqual(t.gt("foo", "bar"), {
        parameters: ["bar - todb"],
        sourceParts: ['"foo" > ', ""],
      });

      assert.strict.deepEqual(t.gt("b", 1), {
        parameters: [1],
        sourceParts: ['"b" > ', ""],
      });

      assert.strict.deepEqual(t.gt("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" > 1'],
      });
    });
  });

  describe("lt()", () => {
    it("should create a less then", () => {
      assert.strict.deepEqual(t.lt("foo", "bar"), {
        parameters: ["bar - todb"],
        sourceParts: ['"foo" < ', ""],
      });

      assert.strict.deepEqual(t.lt("b", 1), {
        parameters: [1],
        sourceParts: ['"b" < ', ""],
      });

      assert.strict.deepEqual(t.lt("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" < 1'],
      });
    });
  });

  describe("gte()", () => {
    it("should create a greater then or equal to", () => {
      assert.strict.deepEqual(t.gte("foo", "bar"), {
        parameters: ["bar - todb"],
        sourceParts: ['"foo" >= ', ""],
      });

      assert.strict.deepEqual(t.gte("b", 1), {
        parameters: [1],
        sourceParts: ['"b" >= ', ""],
      });

      assert.strict.deepEqual(t.gte("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" >= 1'],
      });
    });
  });

  describe("lte()", () => {
    it("should create a less then or equal to", () => {
      assert.strict.deepEqual(t.lte("foo", "bar"), {
        parameters: ["bar - todb"],
        sourceParts: ['"foo" <= ', ""],
      });

      assert.strict.deepEqual(t.lte("b", 1), {
        parameters: [1],
        sourceParts: ['"b" <= ', ""],
      });

      assert.strict.deepEqual(t.lte("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" <= 1'],
      });
    });
  });

  describe("btw()", () => {
    it("should create a between", () => {
      assert.strict.deepEqual(t.btw("foo", "bar", "biz"), {
        parameters: ["bar - todb", "biz - todb"],
        sourceParts: ['"foo" between ', " and ", ""],
      });

      assert.strict.deepEqual(t.btw("b", 1, 2), {
        parameters: [1, 2],
        sourceParts: ['"b" between ', " and ", ""],
      });
    });
  });

  describe("lk()", () => {
    it("should create a like", () => {
      assert.strict.deepEqual(t.lk("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" like 1'],
      });
    });
  });

  describe("in()", () => {
    it("should create a in", () => {
      assert.strict.deepEqual(t.in("foo", "s", sql`1`), {
        parameters: ["s - todb"],
        sourceParts: ['"foo" in (', ", 1)"],
      });

      assert.strict.deepEqual(t.in("b", 1, sql`1`), {
        parameters: [1],
        sourceParts: ['"b" in (', ", 1)"],
      });
    });
  });

  describe("exts()", () => {
    it("should create a exists", () => {
      assert.strict.deepEqual(t.exts("foo", sql`1`), {
        parameters: [],
        sourceParts: ['"foo" exists (1)'],
      });
    });
  });

  describe("get()", () => {
    beforeEach(() => {
      db.execute(sql`drop table if exists $${t.lit("table")}`);
      db.execute(sql`create table $${t.lit("table")} ($${t.lit("foo")} text, $${t.lit("b")} integer);`);
    });

    it("should return undefined if no item was found", () => {
      assert.strict.equal(t.get(sql`select * from $${t.lit("table")}`), undefined);
    });

    it("should return an item with values mapped", () => {
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "foo",
          b: 1,
        })})`,
      );
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "bar",
          b: 1,
        })})`,
      );

      assert.deepEqual(t.get(sql`select * from $${t.lit("table")}`), { foo: "foo - todb - fromdb", b: 1 });
    });
  });

  describe("all()", () => {
    beforeEach(() => {
      db.execute(sql`drop table if exists $${t.lit("table")}`);
      db.execute(sql`create table $${t.lit("table")} ($${t.lit("foo")} text, $${t.lit("b")} integer);`);
    });

    it("should return empty array if no data", () => {
      assert.strict.deepEqual(t.all(sql`select * from $${t.lit("table")}`), []);
    });

    it("should return items with values mapped", () => {
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "foo",
          b: 1,
        })})`,
      );
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "bar",
          b: 2,
        })})`,
      );

      assert.deepEqual(t.all(sql`select * from $${t.lit("table")}`), [
        { foo: "foo - todb - fromdb", b: 1 },
        { foo: "bar - todb - fromdb", b: 2 },
      ]);
    });
  });

  describe("chunkWithTotal()", () => {
    beforeEach(() => {
      db.execute(sql`drop table if exists $${t.lit("table")}`);
      db.execute(sql`create table $${t.lit("table")} ($${t.lit("foo")} text, $${t.lit("b")} integer);`);
    });

    it("should get data in chunks", () => {
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "foo",
          b: 1,
        })})`,
      );
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "bar",
          b: 2,
        })})`,
      );
      t.execute(
        sql`insert into $${t.lit("table")} ($${t.joinLit(["foo", "b"])}) values ($${t.joinValues({
          foo: "bix",
          b: 3,
        })})`,
      );

      assert.strict.deepEqual(t.chunkWithTotal(sql`select * from $${t.lit("table")}`, 2, 0), {
        data: [
          { foo: "foo - todb - fromdb", b: 1 },
          { foo: "bar - todb - fromdb", b: 2 },
        ],
        total: 3,
      });
      assert.strict.deepEqual(t.chunkWithTotal(sql`select * from $${t.lit("table")}`, 2, 2), {
        data: [{ foo: "bix - todb - fromdb", b: 3 }],
        total: 3,
      });
      assert.strict.deepEqual(t.chunkWithTotal(sql`select * from $${t.lit("table")}`, 2, 4), { data: [], total: 3 });
    });
  });
});
