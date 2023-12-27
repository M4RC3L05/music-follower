// eslint-disable-next-line import/no-anonymous-default-export
export default {
  "*.{js,jsx,ts,tsx,mjs}": "biome check",
  "*.{ts,tsx}": () => "tsc -p tsconfig.json --noEmit --skipLibCheck",
};
