import * as database from "#src/database/index.js";

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

export const show = async (context: RouterContext) => {
  const release = database.releases.queries.getById(Number(context.params.id), context.request.query.type as any);

  if (!release) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash(
      "error",
      `No release exist with id "${context.params.id}" of type "${context.request.query.type as string}"`,
    );
    context.redirect("back");

    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  await context.render("releases/show", { release, flashMessages: context.flash() });
};
