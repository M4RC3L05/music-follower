import { Feed } from "feed";
import type { Context } from "koa";

import { makeLogger } from "#src/core/clients/logger.ts";
import type { CollectionMetadata, TrackMetadata } from "#src/entities/release/models/release-model.ts";
import { releaseRepository } from "#src/entities/release/repositories/release-repository.ts";

const logger = makeLogger("rss-middleware");

export async function rssMiddleware(context: Context) {
  const { format } = context.request.query;

  if (!format || typeof format !== "string" || !["rss", "atom", "json"].includes(format)) {
    logger.error({ format }, "Invalid feed format provided");

    context.throw(400, "Invalid feed format provided");
  }

  logger.info("Getting latest releases");

  const releases = await releaseRepository.getCurrent50LatestReleases();

  const feed = new Feed({
    title: "Music releases",
    description: "Get the latest music releases from artist you follow",
    id: "music_follower",
    language: "en",
    copyright: "Music Follower",
    updated: new Date(),
    generator: "Music Follower",
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
      logger.warn({ format }, "Somehow an invalid feed format");

      context.throw(400, "Invalid feed format provided");
    }
  }
}
