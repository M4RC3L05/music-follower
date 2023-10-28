import { type App, Router } from "@m4rc3l05/sss";
import bodyParser from "body-parser";

import { artistsHandlers, releasesHandlers } from "./handlers/mod.js";
import { requestValidator } from "#src/middlewares/mod.js";
import { validator } from "#src/validator/mod.js";

export const makeRouter = async (app: App) => {
  const router = await new Router(app).setup();
  const jsonBodyParser = bodyParser.json();

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
    jsonBodyParser,
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
    jsonBodyParser,
    requestValidator({ validator, schemas: releasesHandlers.updateRelease.schemas }),
    releasesHandlers.updateRelease.handler,
  );

  return router;
};
