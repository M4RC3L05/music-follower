import { type Middleware, type RouteIncomingMessage } from "@m4rc3l05/sss";

import { type validator } from "../validator/mod.js";

import type Ajv from "ajv";

type ErrorMapperDeps = {
  validator: typeof validator;
  schemas: {
    request: {
      query?: { $id: string };
      params?: { $id: string };
      body?: { $id: string };
    };
  };
};

type DataToValidate = {
  hasErrors: boolean;
  request: {
    query?: {
      data: unknown;
      schema: { $id: string };
      errors?: Ajv.ErrorObject[];
    };
    params?: {
      data: unknown;
      schema: { $id: string };
      errors?: Ajv.ErrorObject[];
    };
    body?: {
      data: unknown;
      schema: { $id: string };
      errors?: Ajv.ErrorObject[];
    };
  };
};

const getData = (key: string, request: RouteIncomingMessage) => {
  if (key === "query") return request.searchParams;
  if (key === "params") return request.params;
  if (key === "body") return (request as any as { body: unknown }).body;
};

const requestValidator = (deps: ErrorMapperDeps): Middleware => {
  return async (request, response, next) => {
    const dataToValidate: DataToValidate = {
      hasErrors: false,
      request: {},
    };

    for (const [key, schema] of Object.entries(deps.schemas.request)) {
      dataToValidate.request[key as keyof typeof dataToValidate.request] = {
        data: getData(key, request as RouteIncomingMessage),
        schema,
      };
    }

    for (const [key, toValidate] of Object.entries(dataToValidate.request)) {
      const validate = deps.validator.getSchema(toValidate.schema.$id);

      if (!validate) throw new Error(`No schema found for "${toValidate.schema.$id}"`);

      if (!validate(toValidate.data)) {
        dataToValidate.hasErrors = true;
        dataToValidate.request[key as keyof typeof dataToValidate.request]!.errors = validate.errors!;
      }
    }

    if (dataToValidate.hasErrors) {
      const payload = {};

      for (const [key, { errors }] of Object.entries(dataToValidate.request)) {
        if (!errors) continue;

        Object.assign(payload, { [key]: errors });
      }

      response.statusCode = 422;

      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          error: { code: "validation_failed", errors: payload, message: "Validation failed" },
        }),
      );
      return;
    }

    return next();
  };
};

export default requestValidator;
