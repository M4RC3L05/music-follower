import config from "config";
import { hc } from "hono/client";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import type { Api } from "#src/apps/api/app.js";
import { request } from "#src/common/utils/fetch-utils.js";

const { url, basicAuth } = config.get<{
  url: string;
  basicAuth: { name: string; pass: string };
}>("apps.admin.services.api");

export const serviceRequester = (
  input: URL | RequestInfo,
  init?: RequestInit | undefined,
): Promise<globalThis.Response> => {
  const h = new Headers(init?.headers);

  h.set(
    "authorization",
    `Basic ${Buffer.from(`${basicAuth.name}:${basicAuth.pass}`).toString(
      "base64",
    )}`,
  );

  return request(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    input as any,
    {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      body: init?.body as any,
      headers: h,
      method: init?.method,
    },
    { maxRetries: 0 },
  ).then((response) => {
    if (response.status >= 400 || !response.ok) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      throw new HTTPException((response.status as any as StatusCode) ?? 500, {
        message: "Something went wrong",
      });
    }

    return response;
  }) as Promise<globalThis.Response>;
};

export const client = hc<Api>(url, {
  headers: {
    authorization: `Basic ${Buffer.from(
      `${basicAuth.name}:${basicAuth.pass}`,
    ).toString("base64")}`,
  },
  fetch: serviceRequester,
});
