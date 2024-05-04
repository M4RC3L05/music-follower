import type { Hono } from "hono";
import { ArtistsImportPage } from "#src/apps/admin/views/artists/pages/import.tsx";

export const importPage = (router: Hono) => {
  router.get("/import", (c) => {
    return c.render(<ArtistsImportPage />);
  });

  router.post("/import", async (c) => {
    await c.get("services").api.artistsService.import({
      body: c.req.raw.body!,
      signal: c.req.raw.signal,
      headers: {
        "content-length": c.req.header("content-length") ?? "",
        "content-type": c.req.header("content-type") ?? "",
      },
    });

    return c.redirect("/artists");
  });
};
