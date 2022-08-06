import { ArtistModel } from "#src/entities/artist/models/artist-model.js";
import { ModelObject } from "objection";

export class ArtistRepository {
  async getArtists() {
    return ArtistModel.query();
  }

  async syncArtists(artists: Array<ModelObject<ArtistModel>>) {
    return ArtistModel.transaction(async (trx) => {
      await ArtistModel.query().delete().transacting(trx);
      return ArtistModel.query().insertGraph(artists).transacting(trx);
    });
  }
}

export const artistRepository = new ArtistRepository();
