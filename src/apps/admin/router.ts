import Router from "@koa/router";

import * as artistsController from "#src/apps/admin/controllers/artists-controller.js";
import * as pagesController from "#src/apps/admin/controllers/pages-controller.js";
import * as releasesController from "#src/apps/admin/controllers/releases-controller.js";

const router = new Router();

router.get("/", pagesController.index);
router.get("/releases", releasesController.index);
router.get("/releases/:id", releasesController.show);
router.get("/artists", artistsController.index);
router.post("/artists/subscribe", artistsController.subscribe);
router.post("/artists/unsubscribe", artistsController.unsubscribe);

export default router;
