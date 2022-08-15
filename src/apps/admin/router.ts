import Router from "@koa/router";

import * as artistsController from "#src/apps/admin/controllers/artists-controller.js";
import * as authController from "#src/apps/admin/controllers/auth-controller.js";
import * as pagesController from "#src/apps/admin/controllers/pages-controller.js";
import * as profileController from "#src/apps/admin/controllers/profile-controller.js";
import * as releasesController from "#src/apps/admin/controllers/releases-controller.js";
import { authenticationMiddleware } from "#src/apps/admin/middlewares/authentication-middleware.js";
import { notAuthenticationMiddleware } from "#src/apps/admin/middlewares/not-authenticated-middleware.js";
import { permissionMiddleware } from "#src/apps/admin/middlewares/permission-middleware.js";

const router = new Router();

router.get("/admin", pagesController.index);
router.get("/admin/auth/login", notAuthenticationMiddleware, authController.login);
router.post("/admin/auth/login", notAuthenticationMiddleware, authController.postLogin);
router.post("/admin/auth/logout", authenticationMiddleware, authController.logout);
router.get("/admin/profile", authenticationMiddleware, profileController.index);
router.post("/admin/profile/edit", authenticationMiddleware, profileController.edit);
router.get("/admin/releases", authenticationMiddleware, releasesController.index);
router.get("/admin/artists", authenticationMiddleware, artistsController.index);
router.post(
  "/admin/artists/subscribe",
  authenticationMiddleware,
  permissionMiddleware(["user"]),
  artistsController.subscribe,
);
router.post(
  "/admin/artists/unsubscribe",
  authenticationMiddleware,
  permissionMiddleware(["user"]),
  artistsController.unsubscribe,
);

export default router;
