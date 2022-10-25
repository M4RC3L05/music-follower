import type { RouterContext } from "@koa/router";

import releaseRepository from "#src/data/release/repositories/release-repository.js";

export async function index(context: RouterContext) {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const limit = 12;
  const { results: releases, total } = await releaseRepository.search({
    limit,
    page,
    q: query as string,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await context.render("releases/index", {
    _csrf: context.state._csrf,
    releases,
    limit,
    page,
    query,
    total,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    flashMessages: context.flash(),
  });
}

export async function show(context: RouterContext) {
  const id = Number(context.params.id);

  const release = await releaseRepository.getById(id);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  await context.render("releases/show", { _csrf: context.state._csrf, release, flashMessages: context.flash() });
}
