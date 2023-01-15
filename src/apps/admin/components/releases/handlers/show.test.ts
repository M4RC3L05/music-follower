/* eslint-disable import/no-named-as-default-member */
import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert";

import { type RouterContext } from "@koa/router";
import sinon from "sinon";

import * as database from "#src/database/mod.js";
import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { show } from "./show.js";

describe("show()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();

    sinon.restore();
    sinon.reset();
  });

  it("should render the release page", async () => {
    fixtures.releases.load({ id: 1, type: "track" });
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
