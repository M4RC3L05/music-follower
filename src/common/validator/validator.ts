import Ajv, { type AnySchema } from "ajv";
import addFormats from "ajv-formats";

const makeValidator = (schemas: AnySchema[]) => {
  // eslint-disable-next-line new-cap
  const validator = new Ajv.default({ code: { esm: true }, schemas });

  addFormats.default(validator);

  return validator;
};

export default makeValidator;
