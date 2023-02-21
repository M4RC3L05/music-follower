/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { beforeEach, describe, expect, it } from "vitest";
import sql from "@leafac/sqlite";

import { Table } from "./table.js";
import { db } from "#src/database/mod.js";

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
      expect(t.lit("foo")).toEqual({ parameters: [], sourceParts: ['"foo"'] });
    });
  });

  describe("joinLit()", () => {
    it("should join literals", () => {
      expect(t.joinLit(["foo", "table"], sql`;`)).toEqual({ parameters: [], sourceParts: ['"foo";"t"'] });
    });
  });

  describe("joinValues()", () => {
    it("should join values", () => {
      expect(t.joinValues({ foo: "a", b: 1 })).toEqual({
        parameters: ["a - todb", 1],
        sourceParts: ["", ", ", ""],
      });
    });
  });

  describe("set()", () => {
    it("should create set", () => {
      expect(t.set({ foo: "foo", b: 2 })).toEqual({
        parameters: ["foo - todb", 2],
        sourceParts: ['"foo" = ', ', "b" = ', ""],
      });
    });
  });

  describe("get()", () => {
    beforeEach(() => {
      db.execute(sql`drop table if exists $${t.lit("table")}`);
      db.execute(sql`create table $${t.lit("table")} ($${t.lit("foo")} text, $${t.lit("b")} integer);`);
    });

    it("should return undefined if no item was found", () => {
      expect(t.get(sql`select * from $${t.lit("table")}`)).toBeUndefined();
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

      expect(t.get(sql`select * from $${t.lit("table")}`)).toEqual({ foo: "foo - todb - fromdb", b: 1 });
    });
  });

  describe("all()", () => {
    beforeEach(() => {
      db.execute(sql`drop table if exists $${t.lit("table")}`);
      db.execute(sql`create table $${t.lit("table")} ($${t.lit("foo")} text, $${t.lit("b")} integer);`);
    });

    it("should return empty array if no data", () => {
      expect(t.all(sql`select * from $${t.lit("table")}`)).toEqual([]);
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

      expect(t.all(sql`select * from $${t.lit("table")}`)).toEqual([
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

      expect(t.chunkWithTotal(sql`select * from $${t.lit("table")}`, 2, 0)).toEqual({
        data: [
          { foo: "foo - todb - fromdb", b: 1 },
          { foo: "bar - todb - fromdb", b: 2 },
        ],
        total: 3,
      });
      expect(t.chunkWithTotal(sql`select * from $${t.lit("table")}`, 2, 2)).toEqual({
        data: [{ foo: "bix - todb - fromdb", b: 3 }],
        total: 3,
      });
      expect(t.chunkWithTotal(sql`select * from $${t.lit("table")}`, 2, 4)).toEqual({ data: [], total: 3 });
    });
  });
});
