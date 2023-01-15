/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import { afterEach, describe, it } from "node:test";

import sinon from "sinon";
import { type RouterContext } from "@koa/router";

import { index } from "./pages-controller.js";

describe("Pages Controller", () => {
  describe("index()", () => {
    afterEach(() => {
      sinon.restore();
      sinon.reset();
    });

    it("should render index page", async () => {
      const render = sinon.spy(() => {
        /** */
      });

      await index({
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      assert.strict.equal(render.callCount, 1);
      assert.strict.deepEqual(render.getCalls()[0].args, ["pages/index", { flashMessages: {} }]);
    });
  });
});
