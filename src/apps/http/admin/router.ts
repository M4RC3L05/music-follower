import Router from "@koa/router";

import * as controllers from "#src/apps/http/admin/controllers/mod.js";

const router = new Router();

router.get("/", controllers.pages.index);
router.get("/releases", controllers.releases.index);
router.get("/releases/:id", controllers.releases.show);
router.get("/artists", controllers.artists.index);
router.post("/artists/subscribe", controllers.artists.subscribe);
router.post("/artists/unsubscribe", controllers.artists.unsubscribe);

export default router;
