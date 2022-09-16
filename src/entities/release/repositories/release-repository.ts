import type { ModelObject } from "objection";
import { Model, raw } from "objection";

import { makeLogger } from "#src/core/clients/logger.js";
import { ArtistUserModel } from "#src/entities/artist/models/artist-user-model.js";
import { ReleaseModel } from "#src/entities/release/models/release-model.js";
import { ReleaseUserModel } from "#src/entities/release/models/release-user-mode.js";
import type { UserModel } from "#src/entities/user/models/user-model.js";

const logger = makeLogger("release-repository");

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

  async getCurrent50LatestReleases(userId: number) {
    return ReleaseModel.query()
      .whereIn("id", ReleaseUserModel.query().select("releaseId").where({ userId }))
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

    const usersSubscribedToArtist = await ArtistUserModel.query().where({ artistId });

    logger.info({ count: usersSubscribedToArtist.length, artistId }, "Users subscribed");

    for (const { collectionId, isStreamable, ...release } of releases) {
      if (release.type === "collection") {
        // eslint-disable-next-line no-await-in-loop
        await Model.transaction(async (trx) => {
          await ReleaseModel.query(trx).upsertGraph(release, { insertMissing: true });

          await ReleaseUserModel.query(trx).upsertGraph(
            usersSubscribedToArtist.map(({ userId }) => ({ userId, releaseId: release.id, releaseType: release.type })),
            { insertMissing: true },
          );
        });

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
      await Model.transaction(async (trx) => {
        await ReleaseModel.query(trx).upsertGraph(release, { insertMissing: true });

        await ReleaseUserModel.query(trx).upsertGraph(
          usersSubscribedToArtist.map(({ userId }) => ({ userId, releaseId: release.id, releaseType: release.type })),
          { insertMissing: true },
        );
      });
    }
  }
}

export const releaseRepository = new ReleaseRepository();
