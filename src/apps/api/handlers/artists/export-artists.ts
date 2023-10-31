import { type RouteMiddleware } from "@m4rc3l05/sss";

import { artistsQueries } from "#src/database/mod.js";

export const handler: RouteMiddleware = (request, response) => {
  const artists = artistsQueries.getAll();

  response.statusCode = 200;

  response.setHeader("content-disposition", 'attachment; filename="artists.json"');
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify({ data: artists }));
};
