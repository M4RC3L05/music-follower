/* eslint-disable import/no-named-as-default-member */
import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert";

import { type RouterContext } from "@koa/router";
import sinon from "sinon";

import * as hooks from "#src/utils/tests/hooks/mod.js";
import { index } from "./index.js";

describe("index()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();

    sinon.restore();
    sinon.reset();
  });

  it("should render index page", async () => {
    const render = sinon.spy(() => {
      /** */
    });

    await index({
      request: { query: {} },
      render,
      flash: () => ({
        /** */
      }),
    } as any as RouterContext);

    assert.strict.equal(render.callCount, 1);
    assert.strict.deepEqual(render.getCalls()[0].args, [
      "releases/index",
      { flashMessages: {}, limit: 12, page: 0, query: undefined, releases: [], total: 0 },
    ]);
  });

  it("should render index page with params", async () => {
    const render = sinon.spy(() => {
      /** */
    });

    await index({
      request: { query: { page: 1, q: "foo" } },
      render,
      flash: () => ({
        /** */
      }),
    } as any as RouterContext);

    assert.strict.equal(render.callCount, 1);
    assert.strict.deepEqual(render.getCalls()[0].args, [
      "releases/index",
      { flashMessages: {}, limit: 12, page: 1, query: "foo", releases: [], total: 0 },
    ]);
  });
});
