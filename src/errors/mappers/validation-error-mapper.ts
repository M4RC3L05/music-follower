import { HTTPException } from "hono/http-exception";

import RequestValidationError from "../request-validation-error.js";

const validationalidatorErrorMapper = (error: unknown) => {
  if (!(error instanceof RequestValidationError)) return;

  return Object.assign(new HTTPException(422, { message: error.message }), {
    validationErrors: error.errors,
    cause: error,
  });
};

export default validationalidatorErrorMapper;
