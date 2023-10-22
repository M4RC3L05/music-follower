import Router from "@koa/router";

import { artistsHandlers, releasesHandlers } from "./handlers/mod.js";
import { requestValidator } from "#src/middlewares/mod.js";
import { validator } from "#src/validator/mod.js";

const router = new Router({ prefix: "/api" });

router.get(
  "/artists",
  requestValidator({ validator, schemas: artistsHandlers.getArtists.schemas }),
  artistsHandlers.getArtists.handler,
);
router.get(
  "/artists/remote",
  requestValidator({ validator, schemas: artistsHandlers.getRemoteArtists.schemas }),
  artistsHandlers.getRemoteArtists.handler,
);
router.post(
  "/artists",
  requestValidator({ validator, schemas: artistsHandlers.subscribeArtist.schemas }),
  artistsHandlers.subscribeArtist.handler,
);
router.delete(
  "/artists/:id",
  requestValidator({ validator, schemas: artistsHandlers.unsubscribeArtist.schemas }),
  artistsHandlers.unsubscribeArtist.handler,
);

router.get(
  "/releases",
  requestValidator({ validator, schemas: releasesHandlers.getReleases.schemas }),
  releasesHandlers.getReleases.handler,
);

router.patch(
  "/releases/:id",
  requestValidator({ validator, schemas: releasesHandlers.updateRelease.schemas }),
  releasesHandlers.updateRelease.handler,
);

export default router;
