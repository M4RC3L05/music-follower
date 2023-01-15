import * as database from "#src/database/mod.js";

import type { RouterContext } from "@koa/router";

export const index = async (context: RouterContext) => {
  const page = context.request.query?.page ? Number(context.request.query?.page) : 0;
  const query = context.request.query?.q;
  const limit = 12;
  const { data: releases, total } = database.releases.queries.searchPaginated({ limit, page, q: query as string });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await context.render("releases/index", {
    releases,
    limit,
    page,
    query,
    total,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    flashMessages: context.flash(),
  });
};
