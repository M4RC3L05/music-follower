import config from "config";
import { Feed } from "feed";

import { releases } from "#src/database/index.js";
import logger from "#src/utils/logger/logger.js";

import type { Context } from "koa";

const log = logger("feed-middleware");

export const feedMiddleware = (context: Context) => {
  log.info("Getting latest releases");

  const data = releases.queries.getLatests(config.get<number>("apps.feed.maxReleases"));

  const feed = new Feed({
    title: "Music releases",
    description: "Get the latest music releases from artist you follow",
    id: "music_follower",
    language: "en",
    copyright: "Music Follower",
    updated: new Date(),
    generator: "Music Follower",
  });

  for (const release of data) {
    feed.addItem({
      date: new Date(release.feedAt),
      description: `
      <img src="${release.coverUrl}" />
      <h1>${release.name}</h1><p>${release.artistName}</p>
      <p>${new Date(release.releasedAt).getFullYear()}</p>
      `.trim(),
      title: `${release.name} by ${release.artistName}`,
      id: String(release.id),
      link:
        release.type === "collection"
          ? (release.metadata.collectionViewUrl as string) ?? release.coverUrl
          : release.type === "track"
          ? (release.metadata.trackViewUrl as string) ??
            (release.metadata.collectionViewUrl as string) ??
            release.coverUrl
          : release.coverUrl,
    });
  }

  if (context.request.accepts("application/rss+xml") || context.request.accepts("application/xml")) {
    context.type = context.request.accepts("application/xml") ? "application/xml" : "application/rss+xml";
    context.body = feed.rss2();
  } else if (context.request.accepts("application/atom+xml")) {
    context.type = "application/atom+xml";
    context.body = feed.atom1();
  } else if (context.request.accepts("application/json")) {
    context.type = "application/json";
    context.body = feed.json1();
  } else {
    context.type = "application/xml";
    context.body = feed.rss2();
  }
};
