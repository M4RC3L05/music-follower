import { type FromSchema } from "json-schema-to-ts";
import { type RouterContext } from "@koa/router";

import { artistQueries } from "#src/domain/artists/mod.js";

export const schemas = {
  request: {
    body: {
      $id: "subscribe-artist-request-body",
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
        image: { type: "string", format: "uri" },
      },
      required: ["id", "name", "image"],
      additionalProperties: false,
    },
  },
} as const;

type RequestBody = FromSchema<(typeof schemas)["request"]["body"]>;

export const handler = (context: RouterContext) => {
  const { name, id, image } = context.request.body as RequestBody;

  artistQueries.create({ id: Number(id), name, imageUrl: image });

  context.status = 204;
};
