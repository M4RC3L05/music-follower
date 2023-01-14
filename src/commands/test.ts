import process from "node:process";
import { run as testRunner } from "node:test";

import { promise as glob } from "glob-promise";

export const run = async () => {
  testRunner({
    concurrency: true,
    files: await glob("./src/**/*.test.ts"),
  }).pipe(process.stdout);
};
