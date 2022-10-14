import { createServer } from "node:http";

import { describe, expect, test } from "@jest/globals";
import { makeFetch } from "supertest-fetch";

import { app } from "#src/apps/admin/app.js";

const fetch = makeFetch(createServer(app().callback()));

describe("app", () => {
  test("it should throw 403 if no basic auth provided", async () => {
    const response = await fetch("/");
    expect(response.status).toBe(401);
  });

  test("it should throw 403 if basic auth is invalid", async () => {
    const response = await fetch("/", {
      headers: { authorization: `Basic ${Buffer.from("a:b").toString("base64")}` },
    });
    expect(response.status).toBe(401);
  });

  test("it should allow if basic auth is valid", async () => {
    const response = await fetch("/", {
      headers: { authorization: `Basic ${Buffer.from("foo:bar").toString("base64")}` },
    });
    expect(response.status).toBe(200);
  });
});
