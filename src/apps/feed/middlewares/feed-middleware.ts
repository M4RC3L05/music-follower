import { type Context } from "hono";
import { Feed } from "feed";
import config from "config";
import sql from "@leafac/sqlite";

import { type ItunesLookupAlbumModel, type ItunesLookupSongModel } from "#src/remote/mod.js";
import { type Release } from "#src/database/mod.js";
import { makeLogger } from "#src/common/logger/mod.js";

const log = makeLogger("feed-middleware");

export const feedMiddleware = async (c: Context) => {
  log.info("Getting latest releases");

  const data = c.get("database").all<Release>(sql`
    select *
    from releases
    where date("releasedAt", 'utc') <= date('now', 'utc')
      and not exists(
        select true from json_each(hidden)
        where json_each.value = 'feed'
      )
    order by "feedAt" desc
    limit ${config.get<number>("apps.feed.maxReleases")};
  `);

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
    const parsedMetadata = JSON.parse(release.metadata) as ItunesLookupAlbumModel | ItunesLookupSongModel;

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
          ? parsedMetadata.collectionViewUrl ?? release.coverUrl
          : release.type === "track"
            ? (parsedMetadata as ItunesLookupSongModel).trackViewUrl ??
              parsedMetadata.collectionViewUrl ??
              release.coverUrl
            : release.coverUrl,
    });
  }

  const accepts = c.req.header("accept");

  if (accepts?.includes("application/rss+xml") ?? accepts?.includes("application/xml")) {
    return c.body(feed.rss2(), 200, {
      "content-type": accepts?.includes("application/xml") ? "application/xml" : "application/rss+xml",
    });
  }

  if (accepts?.includes("application/atom+xml")) {
    return c.body(feed.atom1(), 200, { "content-type": "application/atom+xml" });
  }

  if (accepts?.includes("application/json")) {
    return c.body(feed.json1(), 200, { "content-type": "application/json" });
  }

  return c.body(feed.rss2(), 200, { "content-type": "application/xml" });
};
