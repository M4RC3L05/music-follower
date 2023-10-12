import { type BaseContext, type Next } from "koa";
import createHttpError, { type HttpError, isHttpError } from "http-errors";

import { makeLogger } from "#src/common/logger/mod.js";

type ErrorMapperDeps = {
  mappers: Array<(error: unknown) => HttpError | undefined>;
  defaultMapper: (error: unknown) => HttpError;
};

const log = makeLogger("error-mapper-middleware");

const respond = (error: HttpError, ctx: BaseContext) => {
  ctx.status = error.status;

  if (error.headers) {
    ctx.set(error.headers);
  }

  ctx.body = {
    error: {
      code: error.name,
      message: error.expose ? error.message : "Something went wrong",
    },
  };

  if ((error as any)?.validationErrors) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    (ctx.body as any).error.validationErrors = (error as any)?.validationErrors;
  }
};

const errorMapper = (deps: ErrorMapperDeps) => {
  return async (ctx: BaseContext, next: Next) => {
    try {
      await next();

      if (ctx.status === 404 && !ctx.body) {
        throw createHttpError(404, "Route not found");
      }
    } catch (error) {
      log.error(!(error instanceof Error) && !(typeof error === "object") ? { error } : error, "Caught request error");

      if (isHttpError(error)) {
        respond(error, ctx);

        return;
      }

      let mapped: HttpError | undefined;

      for (const mapper of deps.mappers) {
        mapped = mapper(error);

        if (mapped) break;
      }

      if (!mapped) {
        mapped = deps.defaultMapper(error);
      }

      respond(mapped, ctx);
    }
  };
};

export default errorMapper;
