/* eslint-disable no-await-in-loop */
import { setTimeout } from "node:timers/promises";

import * as cronMatch from "@datasert/cronjs-matcher";
import { type CronExprs, parse } from "@datasert/cronjs-parser";

export class Cron {
  #when: CronExprs;
  #abortController: AbortController;
  #working: boolean;
  #worker!: AsyncGenerator<AbortSignal, void>;
  #lastProcessAt?: number;
  #timezone?: string;
  #dateContainer = new Date();
  #tickerTimeout = 500;

  constructor(when: string, timezone?: string, tickerTimeout?: number) {
    this.#when = parse(when, { hasSeconds: true });
    this.#working = false;

    this.#abortController = new AbortController();
    this.#timezone = timezone;
    this.#tickerTimeout = tickerTimeout ?? this.#tickerTimeout;
  }

  start() {
    if (this.#working) return this.#worker;

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
    return cronMatch
      .getFutureMatches(this.#when, {
        hasSeconds: true,
        timezone: this.#timezone,
        formatInTimezone: true,
        maxLoopCount: 2,
        matchValidator: (date) =>
          (this.#lastProcessAt ?? Math.floor(Date.now() / 1000)) !== Math.floor(Date.parse(date) / 1000),
      })
      .at(0);
  }

  #checkTime(at: number) {
    this.#dateContainer.setTime(at);
    return cronMatch.isTimeMatches(this.#when, this.#dateContainer.toISOString(), this.#timezone);
  }

  async *#ticker() {
    while (true) {
      try {
        await setTimeout(this.#tickerTimeout, undefined, {
          signal: this.#abortController.signal,
        });

        yield Math.floor(Date.now() / 1000);
      } catch {
        return;
      }
    }
  }

  async *#work() {
    for await (const at of this.#ticker()) {
      if (this.#checkTime(at * 1000) && (!this.#lastProcessAt || at !== this.#lastProcessAt)) {
        this.#lastProcessAt = at;

        yield this.#abortController.signal;
      }

      if (this.#abortController.signal.aborted) {
        return;
      }
    }
  }
}
