/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import { afterEach, before, describe, it } from "node:test";

import sinon from "sinon";
import { type RouterContext } from "@koa/router";

import * as database from "#src/database/index.js";
import { index, show } from "./releases-controller.js";
import { databaseHooks } from "#src/utils/tests/hooks/index.js";
import { releaseFixtures } from "#src/utils/tests/fixtures/index.js";

describe("Releases Controller", () => {
  before(async () => {
    await databaseHooks.migrate();
  });

  describe("index()", () => {
    afterEach(() => {
      databaseHooks.cleanup();

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

  describe("show()", () => {
    afterEach(() => {
      databaseHooks.cleanup();

      sinon.restore();
      sinon.reset();
    });

    it("should render the release page", async () => {
      releaseFixtures.loadRelease({ id: 1, type: "track" });
      const release = database.releases.queries.getById(1, "track");
      const render = sinon.spy(() => {
        /** */
      });

      await show({
        params: { id: 1 },
        request: { query: { type: "track" } },
        render,
        flash: () => ({
          /** */
        }),
      } as any as RouterContext);

      assert.strict.equal(render.callCount, 1);
      assert.strict.deepEqual(render.getCalls()[0].args, ["releases/show", { flashMessages: {}, release }]);
    });

    it("should redirect if ti did not found the release", async () => {
      const render = sinon.spy(() => {
        /** */
      });
      const flash = sinon.spy(() => {
        /** */
      });
      const redirect = sinon.spy(() => {
        /** */
      });

      await show({ params: { id: 1 }, request: { query: { type: "track" } }, flash, render, redirect } as any);

      assert.strict.equal(render.callCount, 0);
      assert.strict.equal(flash.callCount, 1);
      assert.strict.equal(redirect.callCount, 1);
      assert.strict.deepEqual(flash.getCalls()[0].args, ["error", 'No release exist with id "1" of type "track"']);
      assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
    });
  });
});
