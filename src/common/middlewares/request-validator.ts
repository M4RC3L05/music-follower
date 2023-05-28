import { type Next } from "koa";
import { type RouterContext } from "@koa/router";

import type Ajv from "ajv";

type ErrorMapperDeps = {
  schemas: {
    request: {
      query?: { $id: string };
      params?: { $id: string };
      body?: { $id: string };
    };
  };
  validator: Ajv.default;
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

export class RequestValidationError extends Error {
  errors: {
    request: {
      query?: Ajv.ErrorObject[];
      params?: Ajv.ErrorObject[];
      body?: Ajv.ErrorObject[];
    };
  };

  constructor(options: {
    request: {
      query?: Ajv.ErrorObject[];
      params?: Ajv.ErrorObject[];
      body?: Ajv.ErrorObject[];
    };
  }) {
    super("Request validation failed");

    this.errors = { ...options };
  }
}

const getData = (key: string, ctx: RouterContext) => {
  switch (key) {
    case "query": {
      return ctx.query;
    }

    case "params": {
      return ctx.params;
    }

    case "body": {
      return ctx.request.body;
    }

    default: {
      return undefined;
    }
  }
};

const requestValidator = (deps: ErrorMapperDeps) => {
  return async (ctx: RouterContext, next: Next) => {
    const dataToValidate: DataToValidate = {
      hasErrors: false,
      request: {},
    };

    for (const [key, schema] of Object.entries(deps.schemas.request)) {
      dataToValidate.request[key as keyof typeof dataToValidate.request] = {
        data: getData(key, ctx),
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
      const options = { request: {} };

      for (const [key, { errors }] of Object.entries(dataToValidate.request)) {
        if (!errors) continue;

        Object.assign(options.request, { [key]: errors });
      }

      throw new RequestValidationError(options as ConstructorParameters<typeof RequestValidationError>[0]);
    }

    return next();
  };
};

export default requestValidator;
