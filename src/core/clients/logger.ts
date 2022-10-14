import { pino } from "pino";

export default function makeLogger(namespace: string) {
  return pino({
    name: namespace,
    enabled: process.env.NODE_ENV !== "test",
    level: "info",
    timestamp: () => `,"time": "${new Date().toISOString()}"`,
  });
}
