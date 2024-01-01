import { setTimeout } from "node:timers/promises";
import cronParser from "cron-parser";

export class Cron {
  #when: cronParser.CronExpression;
  #abortController: AbortController;
  #working: boolean;
  #worker!: AsyncGenerator<AbortSignal, void>;
  #lastProcessAt?: number;
  #dateContainer = new Date();
  #tickerTimeout = 500;

  constructor(when: string, timezone?: string, tickerTimeout?: number) {
    this.#when = cronParser.parseExpression(when, { tz: timezone });
    this.#working = false;

    this.#abortController = new AbortController();
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

  nextAt() {
    this.#when.reset(Math.floor(Date.now() / 1000) * 1000);
    return this.#when.next().toString();
  }

  #checkTime(at: number) {
    this.#dateContainer.setTime(at);
    this.#dateContainer.setMilliseconds(0);

    return (
      // @ts-ignore
      this.#when.fields.second.includes(this.#dateContainer.getUTCSeconds()) &&
      // @ts-ignore
      this.#when.fields.minute.includes(this.#dateContainer.getUTCMinutes()) &&
      // @ts-ignore
      this.#when.fields.hour.includes(this.#dateContainer.getUTCHours()) &&
      // @ts-ignore
      this.#when.fields.dayOfMonth.includes(this.#dateContainer.getUTCDate()) &&
      // @ts-ignore
      // We must add 1 to the month value as it starts from 0 and the cron starts from 1.
      this.#when.fields.month.includes(this.#dateContainer.getUTCMonth() + 1) &&
      // @ts-ignore
      this.#when.fields.dayOfWeek.includes(this.#dateContainer.getUTCDay())
    );
  }

  async *#ticker() {
    yield Math.floor(Date.now() / 1000);

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
      if (
        this.#checkTime(at * 1000) &&
        (!this.#lastProcessAt || at !== this.#lastProcessAt)
      ) {
        this.#lastProcessAt = at;

        yield this.#abortController.signal;
      }

      if (this.#abortController.signal.aborted) {
        return;
      }
    }
  }
}
