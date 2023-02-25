import { describe, expect, it } from "vitest";
import sql from "@leafac/sqlite";

import { isQuery, join } from "./sql-utils.js";

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
});
