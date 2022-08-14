import { BaseContext } from "koa";
import RSS from "rss";

import { releaseRepository } from "#src/entities/release/repositories/release-repository.js";

export async function rssMiddleware(context: BaseContext) {
  const releases = await releaseRepository.getCurrent50LatestReleases();

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
