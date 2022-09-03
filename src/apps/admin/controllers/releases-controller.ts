import type { RouterContext } from "@koa/router";

import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";
import { userRepository } from "#src/entities/user/repositories/user-repository.js";

export async function index(context: RouterContext) {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const limit = 12;
  const authUser = await userRepository.getUserByEmail(context.session.user.email);
  const { results: releases, total } = await releaseRepository.search({
    user: authUser,
    limit,
    page,
    q: query as string,
  });

  await context.render("releases/index", {
    _csrf: context.state._csrf,
    releases,
    limit,
    page,
    query,
    total,
    flashMessages: context.flash(),
    authenticated: typeof context.session.user?.email === "string",
    userRole: authUser.role,
  });
}
