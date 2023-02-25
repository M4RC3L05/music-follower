import { artistQueries } from "#src/domain/artists/mod.js";
import logger from "#src/common/clients/logger.js";

import type { RouterContext } from "@koa/router";

const log = logger("subscribe-artists-hander");

export const subscribe = async (context: RouterContext) => {
  const { artistName, artistId, artistImage } = context.request.body as {
    artistName: string;
    artistId: string;
    artistImage: string;
  };

  try {
    log.info({ artistName, artistId, artistImage }, "Subscribing");

    artistQueries.create({ id: Number(artistId), name: artistName, imageUrl: artistImage });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("success", `Successfully subscribed to "${artistName}"`);
  } catch (error: unknown) {
    log.error(error, `Could not subscribe to artists "${artistName}"`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    context.flash("error", `Could not subscribe to artists "${artistName}"`);
  }

  context.redirect("back");
};
