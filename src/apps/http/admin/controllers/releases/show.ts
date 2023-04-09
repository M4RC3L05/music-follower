import { releasesQueries } from "#src/domain/releases/mod.js";

import type { RouterContext } from "@koa/router";

export const show = async (context: RouterContext) => {
  const release = releasesQueries.getById(
    Number(context.params.id),
    context.request.query.type as "track" | "collection",
  );

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
