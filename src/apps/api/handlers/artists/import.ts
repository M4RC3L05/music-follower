import sql from "@leafac/sqlite";
import { type Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { type Artist } from "#src/database/mod.js";

const handler = (router: Hono) => {
  return router.post("/import", async (c) => {
    const { file } = await c.req.parseBody();

    if (!file || !(file instanceof File)) {
      throw new HTTPException(422, { message: "Must provided a artists file" });
    }

    if (file.size > 1024 * 1024 * 3) {
      throw new HTTPException(422, {
        message: `File size must not excceed ${1024 * 1024 * 10} bytes`,
      });
    }

    const parsed = JSON.parse(await file.text()) as { data: Artist[] };

    if (!parsed?.data || !Array.isArray(parsed.data)) {
      return c.body(null, 204);
    }

    c.get("database").executeTransaction(() => {
      for (const artist of parsed.data) {
        c.get("database").run(sql`
          insert into artists (id, "imageUrl", name)
          values (${artist.id}, ${artist.imageUrl}, ${artist.name})
          on conflict (id)
          do update set
            id = ${artist.id},
            "imageUrl" = ${artist.imageUrl},
            name = ${artist.name}
        `);
      }
    });

    return c.body(null, 204);
  });
};

export default handler;
