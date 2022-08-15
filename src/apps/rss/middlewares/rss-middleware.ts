import { Context } from "koa";
import RSS from "rss";

import { makeLogger } from "#src/core/clients/logger.js";
import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";
import { userRepository } from "#src/entities/user/repositories/user-repository.js";

const logger = makeLogger("rss-middleware");

export async function rssMiddleware(context: Context) {
  if (!context.request.query?.email) {
    logger.error({ email: context.request.query?.email }, "No email provided");

    context.throw(400, "No user email provided");
  }

  const user = await userRepository.getUserByEmail(context.request.query.email as string);

  if (!user) {
    logger.error({ email: context.request.query?.email }, "No user found");

    context.throw(404, "Could not find feed");
  }

  logger.info({ email: context.request.query?.email }, "Getting latest releases");

  const releases = await releaseRepository.getCurrent50LatestReleases(user.id);

  const feed = new RSS({
    title: "Music releases",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    feed_url: "",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    site_url: "",
  });

  for (const release of releases) {
    feed.item({
      date: new Date(release.releasedAt),
      description: `
      <img src="${release.coverUrl}" />
      <h1>${release.name}</h1><p>${release.artistName}</p>
      <p>${new Date(release.releasedAt).getFullYear()}</p>
      `.trim(),
      title: `${release.name} by ${release.artistName}`,
      guid: `${release.id}`,
      url: release.coverUrl,
    });
  }

  context.body = feed.xml();
}
