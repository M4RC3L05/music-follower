import type { RouterContext } from "@koa/router";
import type { Next } from "koa";

import { userRepository } from "#src/entities/user/repositories/user-repository.js";

export async function authenticationMiddleware(context: RouterContext, next: Next) {
  if (!context.session.user?.email) {
    context.throw(401, "Not authenticated");
  }

  const user = await userRepository.getUserByEmail(context.session.user.email);

  if (!user) {
    context.throw(401, "Not authenticated");
  }

  await next();
}
