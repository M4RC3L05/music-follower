import * as database from "#src/database/mod.js";
import logger from "#src/utils/logger/logger.js";

import type { RouterContext } from "@koa/router";

const log = logger("unsubscribe-artists-handler");

export const unsubscribe = async (context: RouterContext) => {
  const { id } = context.request.body as { id: string };

  try {
    log.info({ artistId: id }, "Unsubscribing");

    database.artists.queries.deleteById(Number(id));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully unsubscribed`);
  } catch (error: unknown) {
    log.error(error, `Could not unsubscribe from artists "${id}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not unsubscribe from artist`);
  }

  context.redirect("back");
};
