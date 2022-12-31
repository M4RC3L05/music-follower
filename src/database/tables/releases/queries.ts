import sql from "@leafac/sqlite";

import table from "#src/database/tables/releases/table.js";
import { type Release } from "#src/database/tables/releases/types.js";
import { and, lte, or } from "#src/database/utils/sql.js";
import logger from "#src/utils/logger/logger.js";

const log = logger("artists-queries");

export const getLatests = (limit = 50) =>
  table.all<Release>(sql`
    select *
    from $${table.lit("table")}
    where $${lte(sql`date($${table.lit("releasedAt")}, 'utc')`, sql`date('now', 'utc')`)}
    order by $${table.lit("feedAt")} desc
    limit ${limit};
  `);

export const upsertMany = (
  releases: Array<Omit<Release, "feedAt"> & { collectionId?: number; isStreamable?: boolean; feedAt?: Date }>,
) => {
  for (const { collectionId, isStreamable, ...release } of releases) {
    const storedRelease = table.get<Release>(sql`
      select *
      from $${table.lit("table")}
      where $${and(table.eq("id", release.id), table.eq("type", release.type))}
      limit 1;
    `);

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
      log.debug("Upserting release", { id: release.id, type: release.type });

      table.execute(sql`
        insert or replace into $${table.lit("table")}
        ($${table.joinLit(Object.keys(release) as Array<keyof Release>)})
        values
        ($${table.joinValues(release)})
      `);

      continue;
    }

    if (!isStreamable) {
      log.debug("Release is not streamable, ignoring", { id: release.id });

      continue;
    }

    // This is for music releases that are a part of an album that is
    // yet to be releases but some songs are already available.
    const album = table.get<Release>(sql`
      select * from $${table.lit("table")}
      where $${and(table.eq("id", Number(collectionId)), table.eq("type", "collection"))}
      limit 1;
    `);

    // If we do not have the album, we ignore it.
    if (!album) {
      log.debug("No album for track release", { id: release.id });

      continue;
    }

    // If we have an album and the album was already released we return
    if (album.releasedAt <= new Date()) {
      log.debug("The album that contains the current track release, was already released, ignoring", {
        id: release.id,
      });

      continue;
    }

    log.debug("Upserting release", { id: release.id, type: release.type });

    table.execute(sql`
      insert or replace into $${table.lit("table")}
      ($${table.joinLit(Object.keys(release) as Array<keyof Release>)})
      values
      ($${table.joinValues(release)})
    `);
  }
};

export const searchPaginated = ({ limit = 10, page = 0, q }: { page?: number; limit?: number; q?: string } = {}) => {
  return table.chunkWithTotal(
    sql`
      select *
      from $${table.lit("table")}
      $${q ? sql`where ($${or(table.lk("artistName", sql`${`%${q}%`}`), table.lk("name", sql`${`%${q}%`}`))})` : sql``}
      order by $${table.lit("releasedAt")} desc
    `,
    limit,
    page * limit,
  );
};

export const getById = (id: number, type: "collection" | "track") =>
  table.get<Release>(
    sql`select * from $${table.lit("table")} where $${and(table.eq("id", id), table.eq("type", type))} limit 1`,
  );

export const add = (data: Release) =>
  table.run(sql`
    insert into $${table.lit("table")}
      ($${table.joinLit(Object.keys(data) as Array<keyof Release>)})
    values
      ($${table.joinValues(data)})
  `);
