/* eslint-disable import/no-unassigned-import */
import "#tests/setups/database.js";
import "#tests/setups/nock.js";

import process from "node:process";

import { afterAll } from "@jest/globals";

afterAll(() => {
  // Run process cleanup handlers
  process.emit("SIGUSR2");
});
