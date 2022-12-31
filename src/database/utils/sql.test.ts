import assert from "node:assert";
import { describe, it } from "node:test";

import sql from "@leafac/sqlite";

import { and, btw, eq, exts, gt, gte, iin, isQuery, join, lk, lt, lte, ne, not, or } from "#src/database/utils/sql.js";

describe("sql", () => {
  describe("isQuery()", () => {
    it("should detect if it is a query", () => {
      assert.strict.equal(isQuery("foo"), false);
      assert.strict.equal(isQuery(sql`1`), true);
    });
  });

  describe("join()", () => {
    it("should work if no values to join", () => {
      assert.strict.deepEqual(join([]), { parameters: [], sourceParts: [""] });
    });

    it("should join values with a glue", () => {
      assert.strict.deepEqual(join(["foo", sql`1`], sql` and `), { parameters: ["foo"], sourceParts: ["", " and 1"] });
    });
  });

  describe("exts", () => {
    it("should create a exists", () => {
      assert.strict.deepEqual(exts(sql`not`, sql`select * from "foo"`), {
        parameters: [],
        sourceParts: ['not exists (select * from "foo")'],
      });
    });
  });

  describe("iin()", () => {
    it("should create a in", () => {
      assert.strict.deepEqual(iin(sql`"foo"`, "foo", sql`1`), {
        parameters: ["foo"],
        sourceParts: ['"foo" in (', ", 1)"],
      });
    });

    it("should handle no values", () => {
      assert.strict.deepEqual(iin(sql`"foo"`), {
        parameters: [],
        sourceParts: ['"foo" in ()'],
      });
    });
  });

  describe("lk()", () => {
    it("should create a like", () => {
      assert.strict.deepEqual(lk(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" like 1'],
      });

      assert.strict.deepEqual(lk(sql`"foo"`, sql`${`%${"foo"}%`}`), {
        parameters: ["%foo%"],
        sourceParts: ['"foo" like ', ""],
      });
    });
  });

  describe("btw()", () => {
    it("should create a between", () => {
      assert.strict.deepEqual(btw(sql`"foo"`, "foo", sql`1`), {
        parameters: ["foo"],
        sourceParts: ['"foo" between ', " and 1"],
      });

      assert.strict.deepEqual(btw(sql`"foo"`, sql`1`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" between 1 and ', ""],
      });
    });
  });

  describe("lte()", () => {
    it("should create a less than or equal to", () => {
      assert.strict.deepEqual(lte(sql`"foo"`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" <= ', ""],
      });

      assert.strict.deepEqual(lte(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" <= 1'],
      });
    });
  });

  describe("gte()", () => {
    it("should create a geater than or equal to", () => {
      assert.strict.deepEqual(gte(sql`"foo"`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" >= ', ""],
      });

      assert.strict.deepEqual(gte(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" >= 1'],
      });
    });
  });

  describe("lt()", () => {
    it("should create a less than or equal to", () => {
      assert.strict.deepEqual(lt(sql`"foo"`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" < ', ""],
      });

      assert.strict.deepEqual(lt(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" < 1'],
      });
    });
  });

  describe("gt()", () => {
    it("should create a geater than or equal to", () => {
      assert.strict.deepEqual(gt(sql`"foo"`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" > ', ""],
      });

      assert.strict.deepEqual(gt(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" > 1'],
      });
    });
  });

  describe("ne()", () => {
    it("should create a not equal", () => {
      assert.strict.deepEqual(ne(sql`"foo"`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" <> ', ""],
      });

      assert.strict.deepEqual(ne(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" <> 1'],
      });
    });
  });

  describe("eq()", () => {
    it("should create a not equal", () => {
      assert.strict.deepEqual(eq(sql`"foo"`, "foo"), {
        parameters: ["foo"],
        sourceParts: ['"foo" = ', ""],
      });

      assert.strict.deepEqual(eq(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" = 1'],
      });
    });
  });

  describe("not()", () => {
    it("should create a not", () => {
      assert.strict.deepEqual(not(sql`"foo"`), {
        parameters: [],
        sourceParts: ['not "foo"'],
      });
    });
  });

  describe("or()", () => {
    it("should create a or", () => {
      assert.strict.deepEqual(or(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" or 1'],
      });
    });

    it("should handle no values", () => {
      assert.strict.deepEqual(or(), {
        parameters: [],
        sourceParts: [""],
      });
    });

    it("should handle one value", () => {
      assert.strict.deepEqual(or(sql`1`), {
        parameters: [],
        sourceParts: ["1"],
      });
    });
  });

  describe("and()", () => {
    it("should create a and", () => {
      assert.strict.deepEqual(and(sql`"foo"`, sql`1`), {
        parameters: [],
        sourceParts: ['"foo" and 1'],
      });
    });

    it("should handle no values", () => {
      assert.strict.deepEqual(and(), {
        parameters: [],
        sourceParts: [""],
      });
    });

    it("should handle one value", () => {
      assert.strict.deepEqual(and(sql`1`), {
        parameters: [],
        sourceParts: ["1"],
      });
    });
  });
});
