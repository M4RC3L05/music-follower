import Router from "@koa/router";

import * as controllers from "#src/apps/http/admin/controllers/mod.js";

const router = new Router();

router.get("/", controllers.pages.handlers.index);
router.get("/releases", controllers.releases.handlers.index);
router.get("/releases/:id", controllers.releases.handlers.show);
router.get("/artists", controllers.artists.handlers.index);
router.post("/artists/subscribe", controllers.artists.handlers.subscribe);
router.post("/artists/unsubscribe", controllers.artists.handlers.unsubscribe);

export default router;
