/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import { describe, it } from "node:test";

import sinon from "sinon";

import { defer } from "#src/utils/logger/defer-log.js";

describe("defer()", () => {
  it("should defer call", () => {
    const clock = sinon.useFakeTimers(0);
    const fn = sinon.spy();

    const defered = defer(fn);

    assert.strict.equal(fn.callCount, 0);

    defered(1);
    defered(1);

    clock.tick(1000);

    assert.strict.equal(fn.callCount, 2);
    assert.strict.deepEqual(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      fn.getCalls().flatMap(({ args }) => args),
      Array.from({ length: 2 }, () => 1),
    );

    sinon.restore();
    sinon.reset();
  });

  it("should call imidiatly if max cache reached", () => {
    const fn = sinon.spy();

    const defered = defer(fn);

    assert.strict.equal(fn.callCount, 0);

    for (let i = 0; i < 49; i += 1) defered(1);
    defered(1);

    assert.strict.equal(fn.callCount, 50);
    assert.strict.deepEqual(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      fn.getCalls().flatMap(({ args }) => args),
      Array.from({ length: 50 }, () => 1),
    );

    sinon.restore();
    sinon.reset();
  });
});
