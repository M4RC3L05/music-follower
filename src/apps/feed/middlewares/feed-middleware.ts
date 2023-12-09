import { Feed } from "feed";
import { type Middleware } from "@m4rc3l05/sss";
import config from "config";

import { makeLogger } from "#src/common/logger/mod.js";
import { releasesQueries } from "#src/database/mod.js";

const log = makeLogger("feed-middleware");

export const feedMiddleware: Middleware = (request, response) => {
  log.info("Getting latest releases");

  const data = releasesQueries.getLatests(config.get<number>("apps.feed.maxReleases"));

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

  const accepts = request.headers.accept;

  response.statusCode = 200;

  if (accepts?.includes("application/rss+xml") ?? accepts?.includes("application/xml")) {
    response.setHeader(
      "content-type",
      accepts?.includes("application/xml") ? "application/xml" : "application/rss+xml",
    );
    response.end(feed.rss2());
  } else if (accepts?.includes("application/atom+xml")) {
    response.setHeader("content-type", "application/atom+xml");
    response.end(feed.atom1());
  } else if (accepts?.includes("application/json")) {
    response.setHeader("content-type", "application/json");
    response.end(feed.json1());
  } else {
    response.setHeader("content-type", "application/xml");
    response.end(feed.rss2());
  }
};
