/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import process from "node:process";
import { describe, it } from "node:test";

import sinon from "sinon";

import { onProcessSignals } from "#src/utils/process/process.js";

describe("process", () => {
  describe("onProcessSignals()", () => {
    it("should call handlers on signal", (done) => {
      const spy = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();
      const spy4 = sinon.spy();

      // @ts-expect-error
      onProcessSignals({ handler: spy, name: "foo", signals: ["foo"] });
      // @ts-expect-error
      onProcessSignals({ handler: spy2, name: "foo", signals: ["foo"] });
      // @ts-expect-error
      onProcessSignals({ handler: spy3, name: "foo", signals: ["foo", "bar"] });
      // @ts-expect-error
      onProcessSignals({ handler: spy4, name: "foo", signals: ["bar"] });

      process.once("foo", () => {
        assert.strict.equal(spy.callCount, 1);
        assert.strict.equal(spy2.callCount, 1);
        assert.strict.equal(spy3.callCount, 1);
        assert.strict.equal(spy4.callCount, 0);

        done();
      });

      // @ts-expect-error
      process.emit("foo");
    });

    it("should ignore errors thrown", (done) => {
      const spy = sinon.spy(() => {
        throw new Error("fooo");
      });

      // @ts-expect-error
      onProcessSignals({ handler: spy, name: "foo", signals: ["foo"] });

      process.once("foo", () => {
        assert.strict.equal(spy.callCount, 1);
        assert.strict.equal(spy.alwaysThrew(), true);

        done();
      });

      // @ts-expect-error
      process.emit("foo");
    });
  });
});
