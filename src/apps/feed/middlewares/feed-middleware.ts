import config from "config";
import { Feed } from "feed";
import type { Context } from "koa";

import makeLogger from "#src/core/clients/logger.js";
import type { ItunesLookupAlbumModel } from "#src/data/itunes/models/itunes-lookup-album-model.js";
import type { ItunesLookupSongModel } from "#src/data/itunes/models/itunes-lookup-song-model.js";
import releaseRepository from "#src/data/release/repositories/release-repository.js";

const logger = makeLogger(import.meta.url);

export async function feedMiddleware(context: Context) {
  const { format } = context.request.query;

  if (!format || typeof format !== "string" || !["rss", "atom", "json"].includes(format)) {
    logger.error({ format }, "Invalid feed format provided");

    context.throw(400, "Invalid feed format provided");
  }

  logger.info("Getting latest releases");

  const releases = await releaseRepository.getLatestReleases(config.get<number>("apps.feed.maxReleases"));

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
          ? (release.metadata as ItunesLookupAlbumModel).collectionViewUrl ?? release.coverUrl
          : release.type === "track"
          ? (release.metadata as ItunesLookupSongModel).trackViewUrl ??
            (release.metadata as ItunesLookupSongModel).collectionViewUrl ??
            release.coverUrl
          : release.coverUrl,
      image: release.coverUrl,
    });
  }

  switch (format) {
    case "rss": {
      context.type = "application/rss+xml";
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

    /* istanbul ignore next */
    default: {
      logger.warn({ format }, "Somehow an invalid feed format");

      context.throw(400, "Invalid feed format provided");
    }
  }
}
