import { type FromSchema } from "json-schema-to-ts";
import { type RouterContext } from "@koa/router";

import { releasesQueries } from "#src/domain/releases/mod.js";

export const schemas = {
  request: {
    params: {
      $id: "update-release-params",
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
      additionalProperties: false,
    },
    body: {
      $id: "update-release-body",
      type: "object",
      properties: {
        hidden: { type: "array", items: { type: "string", enum: ["feed", "admin"] } },
      },
      additionalProperties: false,
    },
  },
} as const;

type RequestParameters = FromSchema<(typeof schemas)["request"]["params"]>;
type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (context: RouterContext) => {
  const parameters = context.params as RequestParameters;
  const body = context.request.body as RequestBody;

  releasesQueries.update(body, parameters.id);

  context.status = 204;
};
