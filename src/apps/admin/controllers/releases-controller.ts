import { RouterContext } from "@koa/router";

import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";

export async function index(context: RouterContext) {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const limit = 12;
  const { results: releases, total } = await releaseRepository.search({ limit, page, q: query as string });

  await context.render("releases/index", { releases, limit, page, query, total, flashMessages: context.flash() });
}
