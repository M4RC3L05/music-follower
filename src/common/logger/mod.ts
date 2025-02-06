import {
  type BaseHandler,
  ConsoleHandler,
  Logger,
  type LogRecord,
} from "@std/log";
import { memoize } from "@std/cache";
import pineSerializer from "pino-std-serializers";

// deno-lint-ignore no-explicit-any
const formatLogArg = (arg: any) => {
  if (arg?.error instanceof Error) {
    arg.error = pineSerializer.errWithCause(arg.error);
  }

  if (arg?.reason instanceof Error) {
    arg.reason = pineSerializer.errWithCause(arg.reason);
  }

  return arg;
};

const logFormatter = (
  { args, datetime, levelName, loggerName, msg }: LogRecord,
) => {
  return JSON.stringify({
    datetime: datetime.toISOString(),
    level: levelName,
    name: loggerName,
    message: msg,
    data: formatLogArg(args[0]),
  });
};

export const makeLogger = memoize((namespace: string) => {
  const handlers: BaseHandler[] = [];

  if (Deno.env.get("ENV") !== "test") {
    handlers.push(
      new ConsoleHandler("INFO", {
        formatter: logFormatter,
        useColors: false,
      }),
    );
  }

  return new Logger(namespace, "INFO", { handlers: handlers });
}, { getKey: (namespace) => namespace });
