import { sql } from "@m4rc3l05/sqlite-tag";
import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { Artist } from "#src/database/types/mod.ts";

export const importArtists = (router: Hono) => {
  return router.post("/import", async (c) => {
    const { file } = await c.req.parseBody();

    if (!file || !(file instanceof File)) {
      throw new HTTPException(422, { message: "Must provided a artists file" });
    }

    if (file.size > 1024 * 1024 * 3) {
      throw new HTTPException(422, {
        message: `File size must not excceed ${1024 * 1024 * 3} bytes`,
      });
    }

    const parsed = JSON.parse(await file.text()) as { data: Artist[] };

    if (!parsed?.data || !Array.isArray(parsed.data)) {
      return c.body(null, 204);
    }

    c.get("database").transaction(() => {
      for (const artist of parsed.data) {
        c.get("database").execute(sql`
          insert into artists (id, "imageUrl", name)
          values (${artist.id}, ${artist.imageUrl}, ${artist.name})
          on conflict (id)
          do update set
            id = ${artist.id},
            "imageUrl" = ${artist.imageUrl},
            name = ${artist.name}
        `);
      }
    }).immediate();

    return c.body(null, 204);
  });
};
