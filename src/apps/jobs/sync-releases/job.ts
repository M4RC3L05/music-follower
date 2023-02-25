import config from "config";

import { Cron } from "#src/common/utils/cron-utils.js";

export const job = new Cron(config.get("apps.jobs.sync-releases.cron"));
export { run as task } from "#src/apps/jobs/sync-releases/task.js";
