import createHttpError from "http-errors";

const defaultErrorMapper = (error: unknown) => {
  return createHttpError(500, "Something went wrong");
};

export default defaultErrorMapper;
