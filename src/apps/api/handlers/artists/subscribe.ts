import { type FromSchema } from "json-schema-to-ts";
import { type Middleware } from "@m4rc3l05/sss";

import { artistsQueries } from "#src/database/mod.js";

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

export const handler: Middleware = (request, response) => {
  const { name, id, image } = (request as any as { body: RequestBody }).body;

  artistsQueries.create({ id: Number(id), name, imageUrl: image });

  response.statusCode = 204;

  response.end();
};
