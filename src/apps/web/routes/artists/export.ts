import type { Hono } from "@hono/hono";
import { JsonStringifyStream } from "@std/json";

export const exportPage = (router: Hono) => {
  router.get("/export", (c) => {
    const artistsStmt = c.get("database").prepare(
      "select * from artists",
      false,
    );

    const artistsStream = ReadableStream.from(artistsStmt.iterate())
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
