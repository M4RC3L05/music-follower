import { ModelObject, raw } from "objection";

import { ReleaseModel } from "#src/entities/release/models/release-model.js";
import { ReleaseUserModel } from "#src/entities/release/models/release-user-mode.js";
import { UserModel } from "#src/entities/user/models/user-model.js";

export class ReleaseRepository {
  async search({
    user,
    limit = 10,
    page = 0,
    q,
  }: {
    user: ModelObject<UserModel>;
    page: number;
    limit: number;
    q?: string;
  }) {
    const query = ReleaseModel.query().orderBy("releasedAt", "desc");

    if (user.role !== "admin") {
      void query.whereIn("id", ReleaseUserModel.query().select("releaseId").where({ userId: user.id }));
    }

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

  async upsertReleases(releases: Array<ModelObject<ReleaseModel & { collectionId?: number; isStreamable?: boolean }>>) {
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

      // If we do not have the album, do not include it.
      if (!album) {
        continue;
      }

      // If the album was already released we return
      if (album && album.releasedAt.valueOf() < Date.now()) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await ReleaseModel.query().upsertGraph(release, { insertMissing: true });
    }
  }
}

export const releaseRepository = new ReleaseRepository();
