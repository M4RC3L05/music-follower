import { ReleaseModel } from "#src/entities/release/models/release-model.js";
import { ModelObject, raw } from "objection";

export class ReleaseRepository {
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

      if (release.releasedAt instanceof Date) {
        continue;
      }

      if (!isStreamable) {
        continue;
      }

      // This is for music releases that are a part of an album that is
      // yet to be releases but some songs are already available.

      // eslint-disable-next-line no-await-in-loop
      const album = await ReleaseModel.query().where({ id: collectionId }).first();

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
