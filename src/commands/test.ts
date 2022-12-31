import process from "node:process";
import { run } from "node:test";

import { promise as glob } from "glob-promise";

run({
  concurrency: true,
  files: await glob("./src/**/*.test.ts"),
}).pipe(process.stdout);
