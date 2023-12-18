import { type Database } from "@leafac/sqlite";

declare module "hono" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ContextVariableMap {
    database: Database;
  }
}
