import Router from "@koa/router";

import * as artistsController from "#src/apps/admin/controllers/artists-controller.js";
import * as pagesController from "#src/apps/admin/controllers/pages-controller.js";
import * as releasesController from "#src/apps/admin/controllers/releases-controller.js";

const router = new Router();

router.get("/admin", pagesController.index);
router.get("/admin/releases", releasesController.index);
router.get("/admin/artists", artistsController.index);
router.post("/admin/artists/subscribe", artistsController.subscribe);
router.post("/admin/artists/unsubscribe", artistsController.unsubscribe);

export default router;
