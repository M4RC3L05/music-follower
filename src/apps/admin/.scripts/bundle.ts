#!/usr/bin/env -S deno run -A --cached-only

import { build, type Plugin, stop } from "esbuild";
import { resolve } from "@std/path";

const entrypoint = resolve(
  import.meta.dirname!,
  "..",
  "public",
  "css",
  "main.css",
);
const outfilePath = resolve(
  import.meta.dirname!,
  "..",
  "public",
  "css",
  "main.min.css",
);

try {
  Deno.removeSync(outfilePath);
} catch {
  //
}

await build({
  bundle: true,
  minify: true,
  plugins: [
    {
      name: "css-deno-import",
      setup(build) {
        build.onResolve(
          { filter: /^https?:\/\/.*\.css$/ },
          (args) => {
            return ({ path: args.path, namespace: "css-deno-import" });
          },
        );

        build.onLoad(
          { filter: /.*/, namespace: "css-deno-import" },
          async (args) => ({
            contents: await fetch(args.path).then((x) => x.bytes()),
            loader: "css",
          }),
        );
      },
    } as Plugin,
  ],
  entryPoints: [entrypoint],
  outfile: outfilePath,
});

await stop();
