import Router from "@koa/router";

import * as components from "#src/apps/admin/components/mod.js";

const router = new Router();

router.get("/", components.pages.handlers.index);
router.get("/releases", components.releases.handlers.index);
router.get("/releases/:id", components.releases.handlers.show);
router.get("/artists", components.artists.handlers.index);
router.post("/artists/subscribe", components.artists.handlers.subscribe);
router.post("/artists/unsubscribe", components.artists.handlers.unsubscribe);

export default router;
