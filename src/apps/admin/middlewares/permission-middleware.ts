import { RouterContext } from "@koa/router";
import { Next } from "koa";

import { userRepository } from "#src/entities/user/repositories/user-repository.js";

export function permissionMiddleware(roles: string[] = []) {
  return async (context: RouterContext, next: Next) => {
    const user = await userRepository.getUserByEmail(context.session.user?.email);

    if (!user) {
      context.throw(401, "Not authenticated");
    }

    if (!roles.includes(user.role)) {
      context.throw(403, "Not allowed");
    }

    await next();
  };
}
