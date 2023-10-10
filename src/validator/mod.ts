import { artistsHandlers, releasesHandlers } from "#src/apps/api/handlers/mod.js";
import { makeValidator } from "#src/common/validator/mod.js";

const validator = makeValidator([
  ...Object.values(artistsHandlers.getArtists.schemas.request),
  ...Object.values(artistsHandlers.getRemoteArtists.schemas.request),
  ...Object.values(artistsHandlers.subscribeArtist.schemas.request),
  ...Object.values(artistsHandlers.unsubscribeArtist.schemas.request),
  ...Object.values(releasesHandlers.getReleases.schemas.request),
  ...Object.values(releasesHandlers.updateRelease.schemas.request),
]);

export default validator;
