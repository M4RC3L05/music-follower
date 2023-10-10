import type Ajv from "ajv";

class RequestValidationError extends Error {
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

export default RequestValidationError;
