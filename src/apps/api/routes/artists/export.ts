import type { Hono } from "@hono/hono";

export const exportArtists = (router: Hono) => {
  return router.get("/export", (c) => {
    const artists = c.get("database").sql`select * from artists`;

    return c.body(JSON.stringify({ data: artists }), 200, {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="artists.json"',
    });
  });
};
