import type { PartialModelObject } from "objection";

import { ReleaseModel } from "#src/data/release/models/release-model.js";

export function loadRelease(data: PartialModelObject<ReleaseModel>) {
  return ReleaseModel.query().insertAndFetch(data);
}
