import { pino } from "pino";

export const makeLogger = (namespace: string) =>
  pino({
    name: namespace,
    level: process.env.NODE_ENV === "production" ? "info" : "trace",
    timestamp: () => `,"time": "${new Date().toISOString()}"`,
  });
