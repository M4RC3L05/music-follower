import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";

import { artistsQueries } from "#src/database/mod.js";

export const schemas = {
  request: {
    params: {
      $id: "unsubscribe-artist-request-params",
      type: "object",
      properties: {
        id: { type: "string", pattern: "^\\d+$" },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
} as const;

type RequestParameters = FromSchema<(typeof schemas)["request"]["params"]>;

export const handler: RouteMiddleware = (request, response) => {
  const { id } = request.params as RequestParameters;

  const result = artistsQueries.deleteById(Number(id));

  if (result.changes <= 0) {
    response.statusCode = 404;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "not_found", message: "No artist found to unsubscribe" } }));

    return;
  }

  response.statusCode = 204;
  response.end();
};
