import { type FromSchema } from "json-schema-to-ts";
import { type RouteMiddleware } from "@m4rc3l05/sss";

import { artistsQueries } from "#src/database/mod.js";

export const schemas = {
  request: {
    query: {
      $id: "get-artists-request-query",
      type: "object",
      properties: {
        q: { type: "string" },
        page: { type: "string", pattern: "^\\d+$" },
        limit: { type: "string", pattern: "^\\d+$" },
      },
      additionalProperties: false,
    },
  },
} as const;

type RequestQuery = FromSchema<(typeof schemas)["request"]["query"]>;

export const handler: RouteMiddleware = (request, response) => {
  const query = request.searchParams as RequestQuery;
  const limit = query.limit ? Number(query.limit) : 12;
  const page = query.page ? Number(query.page) : 0;
  const { data, total } = artistsQueries.searchPaginated({ limit, page, q: query.q });

  response.statusCode = 200;

  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data, pagination: { total, page, limit } }));
};
