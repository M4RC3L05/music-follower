import { HTTPException } from "@hono/hono/http-exception";
import { errors } from "@vinejs/vine";

function validationErrorMapper(error: unknown) {
  if (!(error instanceof errors.E_VALIDATION_ERROR)) return;

  return Object.assign(
    new HTTPException(422, { message: "Validation failed" }),
    { cause: error, validationErrors: error.messages },
  );
}

export default validationErrorMapper;
