import process from "node:process";
import { inspect } from "node:util";

import { type ChalkInstance, Chalk } from "chalk";
import config from "config";

import { defer } from "#src/utils/logger/defer-log.js";

export const ranking = { debug: 0, info: 1, warn: 2, error: 3 };

type LoggerFormattingFunction = (message: string, data?: any) => string;
type LoggerConfig = { level: number; color: boolean };

/* c8 ignore start */
for (const stream of [process.stdout, process.stderr]) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (stream._handle && stream.isTTY && typeof stream._handle.setBlocking === "function") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    stream._handle.setBlocking(true);
  }
}
/* c8 ignore stop */

const log = (color: ChalkInstance, namespace: string, text: string) => {
  process.stdout.write(`${color.bgMagenta.bold(` ${namespace} `)} ${text}`);
};

const debug = (config: LoggerConfig, color: ChalkInstance) => (message: string, data?: any) =>
  `${color.bgGray.bold(" DEBUG ")} ${color.dim(new Date().toISOString())} ${message}${
    data ? `\n${inspect(data, false, 20, config.color)}` : ""
  }\n`;

const info = (config: LoggerConfig, color: ChalkInstance) => (message: string, data?: any) =>
  `${color.bgCyan.bold(" INFO ")} ${color.dim(new Date().toISOString())} ${message}${
    data ? `\n${inspect(data, false, 20, config.color)}` : ""
  }\n`;

const error = (config: LoggerConfig, color: ChalkInstance) => (message: string, data?: any) =>
  `${color.bgRed.bold(" ERROR ")} ${color.dim(new Date().toISOString())} ${message}${
    data ? `\n${inspect(data, false, 20, config.color)}` : ""
  }\n`;

const warn = (config: LoggerConfig, color: ChalkInstance) => (message: string, data?: any) =>
  `${color.bgYellow.bold(" WARN ")} ${color.dim(new Date().toISOString())} ${message}${
    data ? `\n${inspect(data, false, 20, config.color)}` : ""
  }\n`;

const deferLog = defer(log);

const logger = (namespace: string) => {
  const loggerConfig = config.get<LoggerConfig>("logger");
  const color = new Chalk({ level: loggerConfig.color ? 3 : 0 });

  return {
    debug(...args: Parameters<LoggerFormattingFunction>) {
      if (loggerConfig.level <= ranking.debug) {
        deferLog(color, namespace, debug(loggerConfig, color)(...args));
      }
    },
    info(...args: Parameters<LoggerFormattingFunction>) {
      if (loggerConfig.level <= ranking.info) {
        deferLog(color, namespace, info(loggerConfig, color)(...args));
      }
    },
    error(...args: Parameters<LoggerFormattingFunction>) {
      if (loggerConfig.level <= ranking.error) {
        deferLog(color, namespace, error(loggerConfig, color)(...args));
      }
    },
    warn(...args: Parameters<LoggerFormattingFunction>) {
      if (loggerConfig.level <= ranking.warn) {
        deferLog(color, namespace, warn(loggerConfig, color)(...args));
      }
    },
  };
};

export default logger;
