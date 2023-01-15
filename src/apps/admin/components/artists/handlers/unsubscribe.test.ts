/* eslint-disable import/no-named-as-default-member */
import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert";

import { type RouterContext } from "@koa/router";
import sinon from "sinon";

import * as database from "#src/database/mod.js";
import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { unsubscribe } from "./unsubscribe.js";

describe("unsusbcribe()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();

    sinon.restore();
    sinon.reset();
  });

  it("should flash error if it could not unsubscribe from artist", async () => {
    const flash = sinon.spy(() => {
      /** */
    });
    const redirect = sinon.spy(() => {
      /** */
    });

    sinon.stub(database.artists.table, "run").throws();

    await unsubscribe({ request: { body: { id: 1 } }, flash, redirect } as any as RouterContext);

    assert.strict.equal(flash.callCount, 1);
    assert.strict.equal(redirect.callCount, 1);
    assert.strict.deepEqual(flash.getCalls()[0].args, ["error", "Could not unsubscribe from artist"]);
    assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
  });

  it("should flash success if it unsubscribe to artist", async () => {
    fixtures.artists.load({ id: 1 });
    fixtures.artists.load({ id: 2 });

    const flash = sinon.spy(() => {
      /** */
    });
    const redirect = sinon.spy(() => {
      /** */
    });

    await unsubscribe({ request: { body: { id: 1 } }, flash, redirect } as any as RouterContext);

    assert.strict.equal(flash.callCount, 1);
    assert.strict.equal(redirect.callCount, 1);
    assert.strict.deepEqual(flash.getCalls()[0].args, ["success", "Successfully unsubscribed"]);
    assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
    assert.strict.equal(database.artists.queries.getAll().length, 1);
    assert.strict.equal(database.artists.queries.getById(2)?.id, 2);
  });
});
