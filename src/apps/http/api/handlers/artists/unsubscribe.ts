import { type FromSchema } from "json-schema-to-ts";
import { type RouterContext } from "@koa/router";
import createHttpError from "http-errors";

import { artistQueries } from "#src/domain/artists/mod.js";

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

export const handler = (context: RouterContext) => {
  const { id } = context.params as RequestParameters;

  const result = artistQueries.deleteById(Number(id));

  if (result.changes <= 0) {
    throw createHttpError(404, "No artist found to delete");
  }

  context.status = 204;
};
