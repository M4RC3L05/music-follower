export * as layouts from "./layouts/mod.js";

const replaceAndReloadLink = (url: string) =>
  `javascript:replaceAndReload("${url}")`;

export const utils = { replaceAndReloadLink };
