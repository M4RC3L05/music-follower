import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";

import { releasesQueries } from "#src/database/mod.js";

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

export const handler: RouteMiddleware = (request, response) => {
  const parameters = request.params as RequestParameters;
  const { body } = request as any as { body: RequestBody };

  releasesQueries.update(body, parameters.id);

  response.statusCode = 204;

  response.end();
};
