import config from "config";

import { Cron } from "#src/utils/cron/cron.js";

export const job = new Cron(config.get("apps.jobs.sync-releases.cron"));
export { run as task } from "#src/apps/jobs/sync-releases/task.js";
