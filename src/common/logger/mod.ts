import process from "node:process";

import config from "config";
import { pino } from "pino";

export const makeLogger = (namespace: string) =>
  pino({
    name: namespace,
    enabled: process.env.NODE_ENV !== "test",
    level: config.get("logger.level"),
    formatters: { level: (level) => ({ level }) },
  });
