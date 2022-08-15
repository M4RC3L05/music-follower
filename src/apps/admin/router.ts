import Router from "@koa/router";

import * as artistsController from "#src/apps/admin/controllers/artists-controller.js";
import * as authController from "#src/apps/admin/controllers/auth-controller.js";
import * as pagesController from "#src/apps/admin/controllers/pages-controller.js";
import * as releasesController from "#src/apps/admin/controllers/releases-controller.js";
import { authenticationMiddleware } from "#src/apps/admin/middlewares/authentication-middleware.js";

const router = new Router();

router.get("/admin", pagesController.index);
router.get("/admin/auth/login", authController.login);
router.post("/admin/auth/login", authController.postLogin);
router.get("/admin/releases", authenticationMiddleware, releasesController.index);
router.get("/admin/artists", authenticationMiddleware, artistsController.index);
router.post("/admin/artists/subscribe", authenticationMiddleware, artistsController.subscribe);
router.post("/admin/artists/unsubscribe", authenticationMiddleware, artistsController.unsubscribe);

export default router;
