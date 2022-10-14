import "#tests/setups/database.js";
import "#tests/setups/nock.js";

import { afterAll } from "@jest/globals";

afterAll(() => {
  // Run process cleanup handlers
  process.emit("SIGUSR2");
});
