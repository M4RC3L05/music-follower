import type { Hono } from "@hono/hono";
import { ArtistsImportPage } from "#src/apps/web/views/artists/pages/import.tsx";
import { HTTPException } from "@hono/hono/http-exception";
import type { Artist } from "#src/database/types/mod.ts";
import { TextLineStream } from "@std/streams";
import { JsonParseStream } from "@std/json";
import { parseMultipartRequest } from "@mjackson/multipart-parser";
import { fileTypeFromBuffer } from "file-type";
import { makeLogger } from "#src/common/logger/mod.ts";

const log = makeLogger("artists-import");

const getArtistsFile = async (req: Request) => {
  for await (
    const part of parseMultipartRequest(req, { maxFileSize: 1024 * 1024 * 100 })
  ) {
    if (part.isFile && part.name === "file") {
      return part;
    }
  }

  return;
};

export const importPage = (router: Hono) => {
  router.get("/import", (c) => {
    const formErrors = c.get("session").get("flashFormErrors");

    return c.render(<ArtistsImportPage formErrors={formErrors ?? undefined} />);
  });

  router.post("/import", async (c) => {
    const file = await getArtistsFile(c.req.raw);

    if (!file || file.size <= 0) {
      throw new HTTPException(422, {
        message: "Form validation error",
        cause: { file: ["Must provided a artists file"] },
      });
    }

    const mimetype = await fileTypeFromBuffer(file.bytes);

    if (mimetype?.mime !== "application/gzip") {
      throw new HTTPException(422, {
        message: "Form validation error",
        cause: { file: ["File type is invalid"] },
      });
    }

    const stream = (ReadableStream.from(file.content) as ReadableStream<
      Uint8Array<ArrayBuffer>
    >)
      .pipeThrough(new DecompressionStream("gzip"))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
      .pipeThrough(new JsonParseStream());

    let artistsImported = 0;

    try {
      await c.get("database").transaction(async () => {
        for await (const artist of stream as ReadableStream<Artist>) {
          c.get("database").sql`
          insert into artists (id, image, name)
          values (${artist.id}, ${artist.image}, ${artist.name})
          on conflict (id)
          do update set
            id = ${artist.id},
            image = ${artist.image},
            name = ${artist.name}
        `;

          artistsImported += 1;
        }
      });
    } catch (error) {
      log.error("Error importing artists to db", { error });

      throw new HTTPException(422, {
        message: "Form validation error",
        cause: { file: ["File is malformed"] },
      });
    }

    c.get("session").flash("flashMessages", {
      success: [`Successfully imported ${artistsImported} artist(s)`],
    });

    return c.redirect("/artists");
  });
};
