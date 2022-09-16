import { Feed } from "feed";
import type { Context } from "koa";

import { makeLogger } from "#src/core/clients/logger.js";
import type { CollectionMetadata, TrackMetadata } from "#src/entities/release/models/release-model.js";
import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";
import { userRepository } from "#src/entities/user/repositories/user-repository.js";

const logger = makeLogger("rss-middleware");

export async function rssMiddleware(context: Context) {
  const { email, format } = context.request.query;

  if (!email || typeof email !== "string") {
    logger.error({ email }, "Invalid email provided");

    context.throw(400, "Invalid email provided");
  }

  if (!format || typeof format !== "string" || !["rss", "atom", "json"].includes(format)) {
    logger.error({ format }, "Invalid feed format provided");

    context.throw(400, "Invalid feed format provided");
  }

  const user = await userRepository.getUserByEmail(email);

  if (!user) {
    logger.error({ email }, "No user found");

    context.throw(404, "Could not find feed");
  }

  logger.info({ email }, "Getting latest releases");

  const releases = await releaseRepository.getCurrent50LatestReleases(user.id);

  const feed = new Feed({
    title: "Music releases",
    description: "Get the latest music releases from artist you follow",
    id: user.email,
    language: "en",
    copyright: "Music Follower",
    updated: new Date(),
    generator: "Music follower",
  });

  for (const release of releases) {
    feed.addItem({
      date: new Date(release.releasedAt),
      description: `
      <img src="${release.coverUrl}" />
      <h1>${release.name}</h1><p>${release.artistName}</p>
      <p>${new Date(release.releasedAt).getFullYear()}</p>
      `.trim(),
      title: `${release.name} by ${release.artistName}`,
      id: String(release.id),
      link:
        release.type === "collection"
          ? (release.metadata as CollectionMetadata).collectionViewUrl ?? release.coverUrl
          : release.type === "track"
          ? (release.metadata as TrackMetadata).trackViewUrl ??
            (release.metadata as TrackMetadata).collectionViewUrl ??
            release.coverUrl
          : release.coverUrl,
      image: release.coverUrl,
    });
  }

  switch (format) {
    case "rss": {
      context.type = "application/xml";
      context.body = feed.rss2();
      return;
    }

    case "atom": {
      context.type = "application/atom+xml";
      context.body = feed.atom1();
      return;
    }

    case "json": {
      context.type = "application/json";
      context.body = feed.json1();
      return;
    }

    default: {
      logger.warn({ format, email }, "Someow an invalid feed format");

      context.throw(500, "Invalid feed format");
    }
  }
}
