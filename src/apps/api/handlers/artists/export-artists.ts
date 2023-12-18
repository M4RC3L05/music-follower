import { type Hono } from "hono";
import sql from "@leafac/sqlite";

export const handler = (router: Hono) => {
  router.get("/api/artists/export", (c) => {
    const artists = c.get("database").all(sql`select * from artists;`);

    return c.body(JSON.stringify({ data: artists }), 200, {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="artists.json"',
    });
  });
};
