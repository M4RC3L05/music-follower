/* eslint-disable no-await-in-loop */
import { setTimeout } from "node:timers/promises";

import * as cronMatch from "@datasert/cronjs-matcher";
import { type CronExprs, parse } from "@datasert/cronjs-parser";

export class Cron {
  #when: Date | CronExprs;
  #abortController: AbortController;
  #working: boolean;
  #worker!: AsyncGenerator<AbortSignal, void>;
  #lastProcessAt?: Date;
  #timezone?: string;

  constructor(when: Date | string, timezone?: string) {
    this.#when = typeof when === "string" ? parse(when, { hasSeconds: true }) : when;
    this.#working = false;

    this.#abortController = new AbortController();
    this.#timezone = timezone;
  }

  #checkTime() {
    if (this.#when instanceof Date) {
      return Math.round(Date.now() / 1000) === Math.round(this.#when.getTime() / 1000);
    }

    return cronMatch.isTimeMatches(this.#when, new Date().toISOString(), this.#timezone);
  }

  async *#ticker() {
    let previous = new Date();

    while (true) {
      const now = new Date();
      const next = this.nextTime();
      // Ignore miliseconds as we use seconds as max resolution.
      now.setMilliseconds(0);
      next.setMilliseconds(0);

      // How mutch time until the next execution time.
      const delay = Math.max(next.getTime() - now.getTime(), 0);
      // How mutch the code take
      const drift = Math.max(now.getTime() - previous.getTime(), 0) % 2000;
      const driftFinal = Math.max(0, drift > 1000 ? 1000 - (drift % 1000) : 0);
      // From the delay we take the amount spent on code execution if any
      previous = new Date();
      const final = Math.max(delay - driftFinal - Math.max(previous.getTime() - now.getTime(), 0), 0);

      await setTimeout(final === 0 ? 5 : final, undefined, { signal: this.#abortController.signal }).catch(() => {
        // Prevent throwing if abort signal is called
      });

      yield final;
    }
  }

  async *#work() {
    for await (const _sleepTime of this.#ticker()) {
      if (this.#checkTime()) {
        this.#lastProcessAt = new Date();
        this.#lastProcessAt.setMilliseconds(0);

        yield this.#abortController.signal;
      }

      if (this.#abortController.signal.aborted) {
        return;
      }
    }
  }

  start() {
    if (this.#working) return;

    this.#working = true;
    this.#worker = this.#work();

    return this.#worker;
  }

  async stop() {
    this.#abortController.abort();

    await this.#worker.return();

    this.#working = false;
  }

  nextTime() {
    return this.#when instanceof Date
      ? new Date(this.#when)
      : new Date(
          cronMatch
            .getFutureMatches(this.#when, {
              hasSeconds: true,
              timezone: this.#timezone,
              matchValidator: (x) => {
                const now = new Date();
                const xx = new Date(x);

                now.setMilliseconds(0);
                xx.setMilliseconds(0);

                return (this.#lastProcessAt ?? now).getTime() !== xx.getTime();
              },
            })
            .at(0)!,
        );
  }
}
