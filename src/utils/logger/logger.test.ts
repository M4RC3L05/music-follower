/* eslint-disable simple-import-sort/imports */
/* eslint-disable import/no-named-as-default-member */
import assert from "node:assert";
import process from "node:process";
import util from "node:util";
import { describe, it } from "node:test";

import config from "config";
import sinon from "sinon";

import logger, { ranking } from "#src/utils/logger/logger.js";

describe("logger", () => {
  describe("debug()", () => {
    it("should not log debug if ranking does not match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.info, color: false });
      logger("foo").debug("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should log debug if ranking does match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.debug, color: false });
      logger("foo").debug("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   DEBUG  ${now} foo\n${util.inspect({ ok: true })}\n`]);

      sinon.restore();
      sinon.reset();
    });

    it("should log error if ranking does match without args", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.debug, color: false });
      logger("foo").debug("foo");
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   DEBUG  ${now} foo\n`]);

      sinon.restore();
      sinon.reset();
    });
  });

  describe("info()", () => {
    it("should not log info if ranking does not match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.warn, color: false });
      logger("foo").info("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should log info if ranking does match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.info, color: false });
      logger("foo").info("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   INFO  ${now} foo\n${util.inspect({ ok: true })}\n`]);

      sinon.restore();
      sinon.reset();
    });

    it("should log error if ranking does match without args", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.info, color: false });
      logger("foo").info("foo");
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   INFO  ${now} foo\n`]);

      sinon.restore();
      sinon.reset();
    });
  });

  describe("warn()", () => {
    it("should not log warn if ranking does not match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.error, color: false });
      logger("foo").warn("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should log warn if ranking does match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.warn, color: false });
      logger("foo").warn("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   WARN  ${now} foo\n${util.inspect({ ok: true })}\n`]);

      sinon.restore();
      sinon.reset();
    });

    it("should log error if ranking does match without args", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.warn, color: false });
      logger("foo").warn("foo");
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   WARN  ${now} foo\n`]);

      sinon.restore();
      sinon.reset();
    });
  });

  describe("error()", () => {
    it("should not log error if ranking does not match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");

      sinon.stub(config, "get").withArgs("logger").returns({ level: 5, color: false });
      logger("foo").error("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 0);

      sinon.restore();
      sinon.reset();
    });

    it("should log error if ranking does match", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.error, color: false });
      logger("foo").error("foo", { ok: true });
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   ERROR  ${now} foo\n${util.inspect({ ok: true })}\n`]);

      sinon.restore();
      sinon.reset();
    });

    it("should log error if ranking does match without args", () => {
      const clock = sinon.useFakeTimers(0);
      const spy = sinon.spy(process.stdout, "write");
      const now = new Date().toISOString();

      sinon.stub(config, "get").withArgs("logger").returns({ level: ranking.error, color: false });
      logger("foo").error("foo");
      clock.tick(1000);

      assert.strict.equal(spy.callCount, 1);
      assert.strict.deepEqual(spy.getCall(0).args, [` foo   ERROR  ${now} foo\n`]);

      sinon.restore();
      sinon.reset();
    });
  });
});
