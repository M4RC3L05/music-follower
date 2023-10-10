import Router from "@koa/router";

import * as handlers from "./handlers/mod.js";
import { requestValidator } from "#src/middlewares/mod.js";
import validator from "#src/validator/mod.js";

const router = new Router({ prefix: "/api" });

router.get(
  "/artists",
  requestValidator({ schemas: handlers.artistsHandlers.getArtists.schemas, validator }),
  handlers.artistsHandlers.getArtists.handler,
);
router.get(
  "/artists/remote",
  requestValidator({ schemas: handlers.artistsHandlers.getRemoteArtists.schemas, validator }),
  handlers.artistsHandlers.getRemoteArtists.handler,
);
router.post(
  "/artists",
  requestValidator({ schemas: handlers.artistsHandlers.subscribeArtist.schemas, validator }),
  handlers.artistsHandlers.subscribeArtist.handler,
);
router.delete(
  "/artists/:id",
  requestValidator({ schemas: handlers.artistsHandlers.unsubscribeArtist.schemas, validator }),
  handlers.artistsHandlers.unsubscribeArtist.handler,
);

router.get(
  "/releases",
  requestValidator({ schemas: handlers.releasesHandlers.getReleases.schemas, validator }),
  handlers.releasesHandlers.getReleases.handler,
);

router.patch(
  "/releases/:id",
  requestValidator({ schemas: handlers.releasesHandlers.updateRelease.schemas, validator }),
  handlers.releasesHandlers.updateRelease.handler,
);

export default router;
