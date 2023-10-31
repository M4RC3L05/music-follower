import { type IncomingMessage } from "node:http";

import { Busboy, type BusboyHeaders } from "@fastify/busboy";
import { type RouteMiddleware } from "@m4rc3l05/sss";
import sql from "@leafac/sqlite";

import { type Artist } from "#src/database/mod.js";
import db from "#src/common/database/db.js";

const getFileAsync = async (parser: Busboy, request: IncomingMessage) =>
  new Promise<Map<string, { content: string; filename: string; encoding: string; mimetype: string }>>((resolve) => {
    const files = new Map<string, { content: string; filename: string; encoding: string; mimetype: string }>();

    // eslint-disable-next-line max-params
    parser.on("file", (fieldname, file, filename, encoding, mimetype) => {
      let content = "";

      file.on("data", (data) => {
        content += String(data);
      });
      file.on("end", () => {
        files.set(fieldname, { content, encoding, filename, mimetype });
      });
    });

    parser.on("finish", () => {
      resolve(files);
    });

    request.pipe(parser);
  });

const formDataParser = ({ headers }: { headers: BusboyHeaders }) =>
  new Busboy({
    headers,
    limits: { fields: 1, files: 1, fileSize: 1024 * 1024 * 10 },
  });

export const handler: RouteMiddleware = async (request, response) => {
  const files = await getFileAsync(
    formDataParser({
      headers: request.headers as any as BusboyHeaders,
    }),
    request,
  );

  const file = files.get("artists");

  if (!file) {
    response.statusCode = 422;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "validation_error", message: "No artists file provided" } }));
    return;
  }

  if (file.content.length <= 0) {
    response.statusCode = 422;

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ error: { code: "validation_error", message: "Artists file is empty" } }));
  }

  const parsed = JSON.parse(file.content) as { data: Artist[] };

  db.executeTransaction(() => {
    for (const artist of parsed.data) {
      db.run(sql`
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

  response.statusCode = 204;
  response.end();
};
