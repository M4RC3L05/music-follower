import type { Hono } from "@hono/hono";
import { JsonStringifyStream } from "@std/json";

export const exportPage = (router: Hono) => {
  router.get("/export", (c) => {
    const artists = c.get("database").prepare("select * from artists")
      .iter();
    const artistsStream = ReadableStream.from(artists)
      .pipeThrough(new JsonStringifyStream())
      .pipeThrough(new TextEncoderStream())
      .pipeThrough(new CompressionStream("gzip"));

    return c.body(artistsStream, 200, {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="artists.jsonl.gz"',
      "X-Content-Type-Options": "nosniff",
    });
  });
};
