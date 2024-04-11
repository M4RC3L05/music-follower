import { delay } from "@std/async";

// deno-lint-ignore no-explicit-any
type LogItem = ((...args: any[]) => void) | (() => void);
type Log = { info: LogItem; error: LogItem; warn: LogItem };
type ProcessManagerOptions = {
  log: Log;
  shutdownTimeout?: number;
  hookTimeout?: number;
  onFinishDrain?: (result: DrainResult) => void;
};
type DrainResult = { error?: boolean; reason?: unknown };

export type Hook = { name: string; fn: (() => Promise<void>) | (() => void) };

export class HookDrain {
  #abortController: AbortController;
  #hooks: Hook[];
  #log: Log;
  #shutdownTimeout: number;
  #hookTimeout: number;
  #onFinishDrain?: (result: DrainResult) => void;

  constructor(options: ProcessManagerOptions) {
    this.#abortController = new AbortController();
    this.#hooks = [];
    this.#log = options.log;
    this.#shutdownTimeout = options.shutdownTimeout ?? 12_000;
    this.#hookTimeout = options.hookTimeout ?? 5_000;

    if (options.onFinishDrain) {
      this.#onFinishDrain = options.onFinishDrain;
    }
  }

  get signal() {
    return this.#abortController.signal;
  }

  registerHook(hook: Hook) {
    if (this.#abortController.signal.aborted) return;

    this.#hooks.push(hook);
  }

  async drain() {
    let drainResult: DrainResult;

    try {
      if (this.#abortController.signal.aborted) {
        this.#log.warn("Already processing hooks...");
      }

      this.#log.info("Start draining hooks");

      this.#abortController.abort();

      drainResult = await Promise.race([
        this.#drain().then(
          (withError) => ({ error: withError } as DrainResult),
        ),
        delay(this.#shutdownTimeout, { persistent: false }).then(
          () => ({ error: true, reason: "timeout" } as DrainResult),
        ),
      ]);

      this.#log.info("Finish draining hooks");

      try {
        this.#onFinishDrain?.(drainResult);
      } catch {
        //
      }
    } catch (error) {
      this.#log.error("Error while processing hooks", { error });
      this.#log.info("Finish draining hooks");

      try {
        this.#onFinishDrain?.({ error: true });
      } catch {
        //
      }
    }
  }

  async #drain() {
    let withError = false;

    for (const hook of this.#hooks) {
      this.#log.info(`Processing hook "${hook.name}"`);

      try {
        const response = await Promise.race([
          hook.fn(),
          delay(this.#hookTimeout, { persistent: false }).then(() => "timeout"),
        ]);

        if (response === "timeout") {
          throw new Error("timeout");
        }

        this.#log.info(`Done processing hook "${hook.name}"`);
      } catch (error) {
        this.#log.error(`Error processing hook ${hook.name}`, { error });

        withError = true;

        this.#log.info(`Done processing hook "${hook.name}"`);
      }
    }

    return withError;
  }
}
