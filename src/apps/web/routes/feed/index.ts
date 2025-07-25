import type { Hono } from "@hono/hono";
import config from "#src/common/config/mod.ts";
import { Feed } from "feed";
import type { Release } from "#src/database/types/mod.ts";
import type {
  ItunesLookupAlbumModel,
  ItunesLookupSongModel,
} from "#src/remote/mod.ts";

export const index = (router: Hono) => {
  router.get("/", (c) => {
    const data = c.get("database").sql<Release>`
      select *
      from releases
      where "releasedAt" <= strftime('%Y-%m-%dT%H:%M:%fZ' , 'now')
        and not exists(
          select true from json_each(hidden)
          where json_each.value = 'feed'
        )
      order by "feedAt" desc
      limit ${config.apps.web.feed.maxReleases ?? 10};
    `;

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
      const parsedMetadata = JSON.parse(release.metadata) as
        | ItunesLookupAlbumModel
        | ItunesLookupSongModel;

      feed.addItem({
        date: new Date(release.feedAt),
        description: `
          <img src="${release.coverUrl}" />
          <h1>${release.name}</h1><p>${release.artistName}</p>
          <p>${new Date(release.releasedAt).getFullYear()}</p>
        `.trim(),
        title: `${release.name} by ${release.artistName}`,
        id: String(release.id),
        link: release.type === "collection"
          ? parsedMetadata.collectionViewUrl ?? release.coverUrl
          : release.type === "track"
          ? (parsedMetadata as ItunesLookupSongModel).trackViewUrl ??
            parsedMetadata.collectionViewUrl ??
            release.coverUrl
          : release.coverUrl,
      });
    }

    const accepts = c.req.header("accept");

    if (
      accepts?.includes("application/rss+xml") ??
        accepts?.includes("application/xml")
    ) {
      return c.body(feed.rss2(), 200, {
        "content-type": accepts?.includes("application/rss+xml")
          ? "application/rss+xml"
          : "application/xml",
      });
    }

    if (accepts?.includes("application/atom+xml")) {
      return c.body(feed.atom1(), 200, {
        "content-type": "application/atom+xml",
      });
    }

    if (accepts?.includes("application/json")) {
      return c.body(feed.json1(), 200, { "content-type": "application/json" });
    }

    return c.body(feed.rss2(), 200, { "content-type": "application/xml" });
  });
};
