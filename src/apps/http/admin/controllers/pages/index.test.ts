import { describe, expect, it, vi } from "vitest";
import { type RouterContext } from "@koa/router";

import { index } from "./index.js";

describe("Pages Controller", () => {
  describe("index()", () => {
    it("should render index page", async () => {
      const render = vi.fn();

      await index({
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      expect(render).toHaveBeenCalledOnce();
      expect(render).toHaveBeenCalledWith("pages/index", { flashMessages: {} });
    });
  });
});
