import type { RouterContext } from "@koa/router";

import { releaseQueries } from "#src/database/tables/releases/index.js";

export const index = async (context: RouterContext) => {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const limit = 12;
  const { data: releases, total } = releaseQueries.searchPaginated({ limit, page, q: query as string });

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
};

export const show = async (context: RouterContext) => {
  const release = releaseQueries.getById(Number(context.params.id), context.query.type as any);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  await context.render("releases/show", { _csrf: context.state._csrf, release, flashMessages: context.flash() });
};
