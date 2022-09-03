/* eslint-disable unicorn/no-await-expression-member */

import type { RouterContext } from "@koa/router";

import { userRepository } from "#src/entities/user/repositories/user-repository.js";

export async function index(context: RouterContext) {
  await context.render("pages/index", {
    _csrf: context.state._csrf,
    flashMessages: context.flash(),
    authenticated: typeof context.session.user?.email === "string",
    userRole: context.session.user?.email
      ? (
          await userRepository.getUserByEmail(context.session.user.email)
        ).role
      : undefined,
  });
}
