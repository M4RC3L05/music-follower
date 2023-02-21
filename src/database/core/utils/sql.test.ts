import { describe, expect, it } from "vitest";
import sql from "@leafac/sqlite";

import { and, btw, eq, exts, gt, gte, iin, isQuery, join, lk, lt, lte, ne, not, or } from "./sql.js";

describe("sql", () => {
  describe("isQuery()", () => {
    it("should detect if it is a query", () => {
      expect(isQuery("foo")).toBe(false);
      expect(isQuery({})).toBe(false);
      expect(isQuery(sql`1`)).toBe(true);
    });
  });

  describe("join()", () => {
    it("should work if no values to join", () => {
      expect(join([])).toEqual({ parameters: [], sourceParts: [""] });
    });

    it("should join values with a glue", () => {
      expect(join(["foo", sql`1`], sql` and `)).toEqual({ parameters: ["foo"], sourceParts: ["", " and 1"] });
    });
  });

  describe("exts", () => {
    it("should create a exists", () => {
      expect(exts(sql`not`, sql`select * from "foo"`)).toEqual({
        parameters: [],
        sourceParts: ['not exists (select * from "foo")'],
      });
    });
  });

  describe("iin()", () => {
    it("should create a in", () => {
      expect(iin(sql`"foo"`, "foo", sql`1`)).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" in (', ", 1)"],
      });
    });

    it("should handle no values", () => {
      expect(iin(sql`"foo"`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" in ()'],
      });
    });
  });

  describe("lk()", () => {
    it("should create a like", () => {
      expect(lk(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" like 1'],
      });

      expect(lk(sql`"foo"`, sql`${`%${"foo"}%`}`)).toEqual({
        parameters: ["%foo%"],
        sourceParts: ['"foo" like ', ""],
      });
    });
  });

  describe("btw()", () => {
    it("should create a between", () => {
      expect(btw(sql`"foo"`, "foo", sql`1`)).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" between ', " and 1"],
      });

      expect(btw(sql`"foo"`, sql`1`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" between 1 and ', ""],
      });
    });
  });

  describe("lte()", () => {
    it("should create a less than or equal to", () => {
      expect(lte(sql`"foo"`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" <= ', ""],
      });

      expect(lte(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" <= 1'],
      });
    });
  });

  describe("gte()", () => {
    it("should create a geater than or equal to", () => {
      expect(gte(sql`"foo"`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" >= ', ""],
      });

      expect(gte(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" >= 1'],
      });
    });
  });

  describe("lt()", () => {
    it("should create a less than or equal to", () => {
      expect(lt(sql`"foo"`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" < ', ""],
      });

      expect(lt(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" < 1'],
      });
    });
  });

  describe("gt()", () => {
    it("should create a geater than or equal to", () => {
      expect(gt(sql`"foo"`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" > ', ""],
      });

      expect(gt(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" > 1'],
      });
    });
  });

  describe("ne()", () => {
    it("should create a not equal", () => {
      expect(ne(sql`"foo"`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" <> ', ""],
      });

      expect(ne(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" <> 1'],
      });
    });
  });

  describe("eq()", () => {
    it("should create a not equal", () => {
      expect(eq(sql`"foo"`, "foo")).toEqual({
        parameters: ["foo"],
        sourceParts: ['"foo" = ', ""],
      });

      expect(eq(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" = 1'],
      });
    });
  });

  describe("not()", () => {
    it("should create a not", () => {
      expect(not(sql`"foo"`)).toEqual({
        parameters: [],
        sourceParts: ['not "foo"'],
      });
    });
  });

  describe("or()", () => {
    it("should create a or", () => {
      expect(or(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" or 1'],
      });
    });

    it("should handle no values", () => {
      expect(or()).toEqual({
        parameters: [],
        sourceParts: [""],
      });
    });

    it("should handle one value", () => {
      expect(or(sql`1`)).toEqual({
        parameters: [],
        sourceParts: ["1"],
      });
    });
  });

  describe("and()", () => {
    it("should create a and", () => {
      expect(and(sql`"foo"`, sql`1`)).toEqual({
        parameters: [],
        sourceParts: ['"foo" and 1'],
      });
    });

    it("should handle no values", () => {
      expect(and()).toEqual({
        parameters: [],
        sourceParts: [""],
      });
    });

    it("should handle one value", () => {
      expect(and(sql`1`)).toEqual({
        parameters: [],
        sourceParts: ["1"],
      });
    });
  });
});
