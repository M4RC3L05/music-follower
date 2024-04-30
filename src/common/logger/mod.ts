import {
  type BaseHandler,
  ConsoleHandler,
  Logger,
  type LogRecord,
} from "@std/log";

const isPlainObject = (arg: unknown): arg is Record<string, unknown> =>
  arg !== null && arg !== undefined &&
  Object.getPrototypeOf(arg) === Object.prototype;

export const formatError = (error: Error): Record<string, unknown> => ({
  ...error,
  cause: error.cause instanceof Error ? formatError(error.cause) : error.cause,
  message: error.message,
  name: error.name,
  stack: error.stack,
});

const formatLogArg = (arg: unknown) => {
  if (!isPlainObject(arg)) return;

  if (arg.error instanceof Error) arg.error = formatError(arg.error);
  if (arg.reason instanceof Error) arg.reason = formatError(arg.reason);

  return arg;
};

const logFormatter = (
  { args, datetime, levelName, loggerName, msg }: LogRecord,
) => {
  const payload = {
    datetime: datetime.toISOString(),
    level: levelName,
    name: loggerName,
    message: msg,
    data: formatLogArg(args[0]),
  };

  return JSON.stringify(payload);
};

export const makeLogger = (namespace: string) => {
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
};
