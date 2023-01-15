/* eslint-disable import/no-named-as-default-member */
import { afterEach, before, describe, it } from "node:test";
import assert from "node:assert";

import { type RouterContext } from "@koa/router";
import sinon from "sinon";

import * as hooks from "#src/utils/tests/hooks/mod.js";
import { subscribe } from "./subscribe.js";

describe("subscribe()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  afterEach(() => {
    hooks.database.cleanup();

    sinon.restore();
    sinon.reset();
  });

  it("should flash error if it fails to subscribe", async () => {
    const flash = sinon.spy(() => {
      /** */
    });
    const redirect = sinon.spy(() => {
      /** */
    });

    await subscribe({
      request: { body: { artistName: "foo", artistId: "foo", artistImage: "biz" } },
      flash,
      redirect,
    } as any as RouterContext);

    assert.strict.equal(flash.callCount, 1);
    assert.strict.equal(redirect.callCount, 1);
    assert.strict.deepEqual(flash.getCalls()[0].args, ["error", 'Could not subscribe to artists "foo"']);
    assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
  });

  it("should flash success if it subscribes to artist", async () => {
    const flash = sinon.spy(() => {
      /** */
    });
    const redirect = sinon.spy(() => {
      /** */
    });

    await subscribe({
      request: { body: { artistName: "foo", artistId: 123, artistImage: "biz" } },
      flash,
      redirect,
    } as any as RouterContext);

    assert.strict.equal(flash.callCount, 1);
    assert.strict.equal(redirect.callCount, 1);
    assert.strict.deepEqual(flash.getCalls()[0].args, ["success", 'Successfully subscribed to "foo"']);
    assert.strict.deepEqual(redirect.getCalls()[0].args, ["back"]);
  });
});
