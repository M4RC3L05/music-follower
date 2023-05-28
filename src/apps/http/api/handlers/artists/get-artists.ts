import { type FromSchema } from "json-schema-to-ts";
import { type RouterContext } from "@koa/router";

import { artistQueries } from "#src/domain/artists/mod.js";

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

export const handler = (context: RouterContext) => {
  const query = context.query as RequestQuery;
  const limit = query.limit ? Number(query.limit) : 12;
  const page = query.page ? Number(query.page) : 0;
  const { data, total } = artistQueries.searchPaginated({ limit, page, q: query.q ?? "" });

  context.body = { data, pagination: { total, page, limit } };
};
