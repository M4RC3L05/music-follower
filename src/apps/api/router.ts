import { Router } from "@m4rc3l05/sss";

import { artistsHandlers, releasesHandlers } from "./handlers/mod.js";
import { jsonBodyParser, requestValidator } from "#src/middlewares/mod.js";
import { validator } from "#src/validator/mod.js";

const router = await new Router().setup();

router.get(
  "/api/artists",
  requestValidator({ validator, schemas: artistsHandlers.getArtists.schemas }),
  artistsHandlers.getArtists.handler,
);
router.get(
  "/api/artists/remote",
  requestValidator({ validator, schemas: artistsHandlers.getRemoteArtists.schemas }),
  artistsHandlers.getRemoteArtists.handler,
);
router.post(
  "/api/artists",
  jsonBodyParser(),
  requestValidator({ validator, schemas: artistsHandlers.subscribeArtist.schemas }),
  artistsHandlers.subscribeArtist.handler,
);
router.delete(
  "/api/artists/:id",
  requestValidator({ validator, schemas: artistsHandlers.unsubscribeArtist.schemas }),
  artistsHandlers.unsubscribeArtist.handler,
);

router.get(
  "/api/releases",
  requestValidator({ validator, schemas: releasesHandlers.getReleases.schemas }),
  releasesHandlers.getReleases.handler,
);
router.patch(
  "/api/releases/:id",
  jsonBodyParser(),
  requestValidator({ validator, schemas: releasesHandlers.updateRelease.schemas }),
  releasesHandlers.updateRelease.handler,
);

export default router;
