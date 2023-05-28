import { artistsHandlers, releasesHandlers } from "#src/apps/http/api/handlers/mod.js";
import makeValidator from "./validator.js";

const validator = makeValidator([
  ...Object.values(artistsHandlers.getArtists.schemas.request),
  ...Object.values(artistsHandlers.getRemoteArtists.schemas.request),
  ...Object.values(artistsHandlers.subscribeArtist.schemas.request),
  ...Object.values(artistsHandlers.unsubscribeArtist.schemas.request),
  ...Object.values(releasesHandlers.getReleases.schemas.request),
]);

export default validator;
