import { type FromSchema } from "json-schema-to-ts";
import { type RouterContext } from "@koa/router";

import { releasesQueries } from "#src/domain/releases/mod.js";

export const schemas = {
  request: {
    query: {
      $id: "get-releases-request-query",
      type: "object",
      properties: {
        q: { type: "string" },
        hidden: { type: "string", enum: ["feed", "admin"] },
        notHidden: { type: "string", enum: ["feed", "admin"] },
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
  const { data, total } = releasesQueries.searchPaginated({
    limit,
    page,
    q: query.q,
    hidden: query.hidden,
    notHidden: query.notHidden,
  });

  context.body = { data, pagination: { total, page, limit } };
};
