import type { PartialModelObject } from "objection";

import { ArtistModel } from "#src/data/artist/models/artist-model.js";

export function loadArtist(data: PartialModelObject<ArtistModel>) {
  return ArtistModel.query().insertAndFetch(data);
}
