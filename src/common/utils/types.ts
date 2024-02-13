import type { Env, Hono } from "hono";

export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };

export type SchemaType<H> = H extends Hono<Env, infer S, "/"> ? S : never;
