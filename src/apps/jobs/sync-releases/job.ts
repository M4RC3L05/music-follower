import config from "config";

import { Cron } from "#src/common/utils/cron-utils.js";

const { pattern, timezone, tickerTimeout } = config.get<{ pattern: string; tickerTimeout?: number; timezone: string }>(
  "apps.jobs.sync-releases.cron",
);
export const job = new Cron(pattern, timezone, tickerTimeout);
export { run as task } from "#src/apps/jobs/sync-releases/task.js";
