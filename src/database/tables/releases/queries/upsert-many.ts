import sql from "@leafac/sqlite";

import { type Release } from "../types.js";
import { makeLogger } from "#src/common/logger/mod.js";
import releasesTable from "../table.js";

const log = makeLogger("upsert-many-query");

export const upsertMany = (
  releases: Array<Omit<Release, "feedAt"> & { collectionId?: number; isStreamable?: boolean; feedAt?: Date }>,
  options?: { noHiddenOverride: boolean },
) => {
  for (const { collectionId, isStreamable, ...release } of releases) {
    const storedRelease = releasesTable.get<Release>(sql`
      select *
      from $${releasesTable.lit("table")}
      where $${releasesTable.lit("id")} = ${release.id}
      and   $${releasesTable.lit("type")} = ${release.type}
      limit 1;
    `);

    // Do not override currently setted hidden status
    if (storedRelease && options?.noHiddenOverride) {
      release.hidden = storedRelease.hidden;
    }

    // Determine the feed position, defaults to using provided `feedAt`.
    // If the collection/track is a pre-release (the releasedAt is an upcomming date) we use the releasedAt,
    // this way we maintain the order of the release in the feed.
    // If it was released, we set the current date, this way, it will appear in the feed in the reverse order as the releases were processed,
    // the last release being processed will be the first in the list and so on.
    release.feedAt =
      release.feedAt ??
      storedRelease?.feedAt ??
      (new Date(release.releasedAt).getTime() > Date.now() ? new Date(release.releasedAt) : new Date());

    if (release.type === "collection") {
      log.debug({ id: release.id, type: release.type }, "Upserting release");

      releasesTable.execute(sql`
        insert or replace into $${releasesTable.lit("table")}
        ($${releasesTable.joinLit(Object.keys(release) as Array<keyof Release>)})
        values
        ($${releasesTable.joinValues(release)})
      `);

      continue;
    }

    if (!isStreamable) {
      log.debug({ id: release.id }, "Release is not streamable, ignoring");

      continue;
    }

    // This is for music releases that are a part of an album that is
    // yet to be releases but some songs are already available.
    const album = releasesTable.get<Release>(sql`
      select * from $${releasesTable.lit("table")}
      where $${releasesTable.lit("id")} = ${Number(collectionId)}
      and   $${releasesTable.lit("type")} = 'collection'
      limit 1;
    `);

    // If we do not have the album, we ignore it.
    if (!album) {
      log.debug({ id: release.id }, "No album for track release");

      continue;
    }

    // If we have an album and the album was already released we return
    if (album.releasedAt <= new Date()) {
      log.debug(
        { id: release.id },
        "The album that contains the current track release, was already released, ignoring",
      );

      continue;
    }

    // If for some reason the track has an invalid date (most likely there was no releasedAt in the first place)
    // we set its as the current date or the one in the db if the release was already stored, since we can stream it.
    if (Number.isNaN(release.releasedAt.getTime())) {
      release.releasedAt = storedRelease?.releasedAt ?? new Date();
    }

    log.debug({ id: release.id, type: release.type }, "Upserting release");

    releasesTable.execute(sql`
      insert or replace into $${releasesTable.lit("table")}
      ($${releasesTable.joinLit(Object.keys(release) as Array<keyof Release>)})
      values
      ($${releasesTable.joinValues(release)})
    `);
  }
};