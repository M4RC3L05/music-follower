import { type IncomingMessage, type ServerResponse } from "node:http";

import { type HttpError, isHttpError } from "http-errors";
import { type ErrorHandler } from "@m4rc3l05/sss";
import { snakeCase } from "lodash-es";

import { makeLogger } from "../common/logger/mod.js";

type ErrorMapperDeps = {
  mappers: Array<(error: unknown) => HttpError | undefined>;
  defaultMapper: (error: unknown) => HttpError;
  jsonResponse?: boolean;
};

const log = makeLogger("error-mapper-middleware");

const respond = (isJson?: boolean) => (error: HttpError, _: IncomingMessage, response: ServerResponse) => {
  response.statusCode = error.statusCode;

  if (error.headers) {
    for (const [key, value] of Object.entries(error.headers)) {
      response.setHeader(key, value);
    }
  }

  response.setHeader("content-type", isJson ? "application/json" : "text/html");

  response.end(
    JSON.stringify({
      error: {
        code: snakeCase(error.name),
        message: error.message,
      },
    }),
  );
};

const errorMapper = (deps: ErrorMapperDeps): ErrorHandler => {
  const respondBinded = respond(deps.jsonResponse);

  return (error, request, response) => {
    log.error(!(error instanceof Error) && !(typeof error === "object") ? { error } : error, "Caught request error");

    if (isHttpError(error)) {
      respondBinded(error, request, response);

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

    respondBinded(mapped, request, response);
  };
};

export default errorMapper;
