import { type z } from "zod";

class RequestValidationError extends Error {
  errors: {
    request: {
      query?: z.ZodError;
      params?: z.ZodError;
      body?: z.ZodError;
    };
  };

  constructor(options: {
    request: {
      query?: z.ZodError;
      params?: z.ZodError;
      body?: z.ZodError;
    };
  }) {
    super("Request validation failed");

    this.errors = {
      request: Object.fromEntries(
        Object.entries(options.request).map(([key, value]) => [
          key,
          Object.fromEntries(
            value.issues.map((issue) => [
              issue.path.join("."),
              {
                code: issue.code,
                message: issue.message,
                path: issue.path,
              },
            ]),
          ),
        ]),
      ),
    };
  }
}

export default RequestValidationError;
