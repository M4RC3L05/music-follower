import { RouterContext } from "@koa/router";
import bcrypt from "bcrypt";

import { makeLogger } from "#src/core/clients/logger.js";
import { userRepository } from "#src/entities/user/repositories/user-repository.js";

const logger = makeLogger("auth-controller");

export async function login(context: RouterContext) {
  await context.render("auth/login", { _csrf: context.state._csrf, flashMessages: context.flash() });
}

export async function postLogin(context: RouterContext) {
  const { email, password } = context.request.body;

  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    logger.warn({ email }, "Could not find a user with credentials");

    context.flash("error", "Could not login, input correct credentials");

    context.redirect("back");
    return;
  }

  if (!(await bcrypt.compare(password, user.password))) {
    logger.warn({ email }, "Password is not valid");

    context.flash("error", "Could not login, input correct credentials");

    context.redirect("back");
    return;
  }

  context.session.user = { email: user.email };
  context.flash("success", `Welcome "${user.username}"`);
  context.redirect("/admin/artists");
}
