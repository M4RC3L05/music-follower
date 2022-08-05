import { ReleaseModel } from "#src/entities/release/models/release-model.js";
import { ModelObject, raw } from "objection";

export class ReleaseRepository {
  async getCurrent50LatestReleases() {
    return ReleaseModel.query()
      .where(raw("DATE(\"releasedAt\", 'utc')"), "<=", raw("DATE('now', 'utc')"))
      .orderBy("releasedAt", "desc")
      .limit(50);
  }

  async upsertReleases(releases: Array<ModelObject<ReleaseModel>>) {
    return ReleaseModel.query().upsertGraph(releases, { insertMissing: true });
  }
}

export const releaseRepository = new ReleaseRepository();
