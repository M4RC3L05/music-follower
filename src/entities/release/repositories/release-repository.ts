import type { ModelObject } from "objection";
import { raw } from "objection";

import { makeLogger } from "#src/core/clients/logger.js";
import { ReleaseModel } from "#src/entities/release/models/release-model.js";

const logger = makeLogger("release-repository");

export class ReleaseRepository {
  async search({ limit = 10, page = 0, q }: { page: number; limit: number; q?: string }) {
    const query = ReleaseModel.query().orderBy("releasedAt", "desc");

    if (q) {
      void query.where((qb) => {
        void qb
          .orWhere(raw('lower("artistName")'), "like", `%${q.toLowerCase()}%`)
          .orWhere(raw('lower("name")'), "like", `%${q.toLowerCase()}%`);
      });
    }

    return query.page(page, limit);
  }

  async getCurrent50LatestReleases() {
    return ReleaseModel.query()
      .where(raw("DATE(\"releasedAt\", 'utc')"), "<=", raw("DATE('now', 'utc')"))
      .orderBy("releasedAt", "desc")
      .limit(50);
  }

  async updateRelease(data: Partial<ModelObject<ReleaseModel>>, id: number) {
    return ReleaseModel.query().updateAndFetchById(id, data);
  }

  async upsertReleases(
    artistId: number,
    releases: Array<ModelObject<ReleaseModel & { collectionId?: number; isStreamable?: boolean }>>,
  ) {
    logger.info({ artistId }, "Upserting releases for artist");

    for (const { collectionId, isStreamable, ...release } of releases) {
      if (release.type === "collection") {
        // eslint-disable-next-line no-await-in-loop
        await ReleaseModel.query().upsertGraph(release, { insertMissing: true });

        continue;
      }

      if (!isStreamable) {
        continue;
      }

      // This is for music releases that are a part of an album that is
      // yet to be releases but some songs are already available.

      // eslint-disable-next-line no-await-in-loop
      const album = await ReleaseModel.query().where({ id: collectionId }).first();

      // If we do not have the album, we ignore it.
      if (!album) {
        continue;
      }

      // If we have an album and the album was already released we return
      if (album.releasedAt.valueOf() < Date.now()) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await ReleaseModel.query().upsertGraph(release, { insertMissing: true });
    }
  }
}

export const releaseRepository = new ReleaseRepository();
