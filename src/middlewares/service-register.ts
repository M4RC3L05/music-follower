import type { Context, ContextVariableMap, Next } from "@hono/hono";

const serviceRegister = (deps: Partial<ContextVariableMap>) => {
  return (c: Context, next: Next) => {
    if (deps.database) c.set("database", deps.database);
    if (deps.shutdown) c.set("shutdown", deps.shutdown);
    if (deps.services) c.set("services", deps.services);

    return next();
  };
};

export default serviceRegister;
