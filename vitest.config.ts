/* eslint-disable n/file-extension-in-import */

import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: "c8",
    },
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
