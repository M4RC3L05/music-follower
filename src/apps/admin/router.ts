import type { Hono } from "hono";
import { handler } from "./handlers/mod.js";

export const router = (app: Hono) => {
  handler(app);
};
