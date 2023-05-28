import createHttpError from "http-errors";

import { RequestValidationError } from "../../middlewares/request-validator.js";

const validationalidatorErrorMapper = (error: unknown) => {
  if (!(error instanceof RequestValidationError)) return;

  return Object.assign(
    createHttpError(422, error.message, {
      name: "RequestValidationError",
      cause: error,
    }),
    { validationErrors: error.errors },
  );
};

export default validationalidatorErrorMapper;
