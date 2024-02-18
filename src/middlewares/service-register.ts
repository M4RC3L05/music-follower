import type { Context, ContextVariableMap, Next } from "hono";
import type { DeepPartial } from "#src/common/utils/types.js";

const serviceRegister = (deps: DeepPartial<ContextVariableMap>) => {
  return (c: Context, next: Next) => {
    if (deps.database) c.set("database", deps.database);
    if (deps.services) c.set("services", deps.services);

    return next();
  };
};

export default serviceRegister;
