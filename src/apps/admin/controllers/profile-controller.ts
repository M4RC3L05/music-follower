import type { RouterContext } from "@koa/router";
import bcrypt from "bcrypt";

import { makeLogger } from "#src/core/clients/logger.js";
import { UserModel } from "#src/entities/user/models/user-model.js";
import { userRepository } from "#src/entities/user/repositories/user-repository.js";

const logger = makeLogger("profile-controller");

export async function index(context: RouterContext) {
  const user = await userRepository.getUserByEmail(context.session.user.email);

  await context.render("profile/index", {
    _csrf: context.state._csrf,
    user,
    flashMessages: context.flash(),
    authenticated: typeof context.session.user?.email === "string",
    userRole: user.role,
  });
}

export async function edit(context: RouterContext) {
  const { username, email, currentPassword, newPassword } = context.request.body;
  const user = await userRepository.getUserByEmail(context.session.user.email);
  const isValid = await bcrypt.compare(currentPassword as string, user.password);

  if (!isValid) {
    logger.error("Password mismatch");
    context.flash("error", "Password mismatch");
    context.redirect("back");

    return;
  }

  const toUpdate = {};

  if (username !== user.username) {
    logger.info({ prev: user.username, new: username }, "Updating username");

    (toUpdate as any).username = username;
  }

  if (email !== user.email) {
    const exists = (await userRepository.getUserByEmail(email as string)) instanceof UserModel;

    if (exists) {
      logger.info({ prev: user.email, new: email }, "Email in use");
      context.flash("error", "Email already in use");
      context.redirect("back");

      return;
    }

    logger.info({ prev: user.email, new: email }, "Updating email");
    (toUpdate as any).email = email;
  }

  if (newPassword) {
    logger.info("Updating password");

    (toUpdate as any).password = await bcrypt.hash(newPassword as string, 12);
  }

  await userRepository.updateUser(user.id, toUpdate as any);
  const updatedUser = await userRepository.getUser(user.id);

  context.session.user = { email: updatedUser.email };
  context.flash("success", "Profile updated");
  context.redirect("back");
}
