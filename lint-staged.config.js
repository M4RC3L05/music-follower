/* eslint-disable @typescript-eslint/naming-convention */

export default {
  "*.{js,jsx,ts,tsx,mjs}": "eslint",
  "*.{ts,tsx}": () => "tsc -p tsconfig.json --noEmit --skipLibCheck",
};
