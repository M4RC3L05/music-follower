/* eslint-disable @typescript-eslint/naming-convention */

export default {
  "*.{js,jsx,ts,tsx}": "eslint",
  "*.{ts,tsx}": () => "tsc -p tsconfig.json --noEmit --skipLibCheck",
};
