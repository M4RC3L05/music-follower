import { type Cron } from "#src/common/utils/cron-utils.js";

export type Job = {
  cron: Cron;
  task: { run: (signal: AbortSignal) => Promise<void> | void };
  terminate: () => Promise<void> | void;
};
