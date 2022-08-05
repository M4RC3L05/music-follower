import { ArtistModel } from "#src/entities/artist/models/artist-model.js";

export class ArtistRepository {
  getArtists() {
    return ArtistModel.query();
  }
}

export const artistRepository = new ArtistRepository();
