import type { ModelObject } from "objection";
import { raw } from "objection";

import { ArtistModel } from "#src/entities/artist/models/artist-model.js";
import { ArtistUserModel } from "#src/entities/artist/models/artist-user-model.js";
import type { UserModel } from "#src/entities/user/models/user-model.js";

export class ArtistRepository {
  async getArtists() {
    return ArtistModel.query();
  }

  async searchArtists({
    user,
    page = 0,
    limit = 12,
    q,
  }: {
    user: ModelObject<UserModel>;
    page: number;
    limit: number;
    q?: string;
  }) {
    const query = ArtistModel.query().orderBy("name", "asc");

    if (user.role !== "admin") {
      void query.whereIn("id", ArtistUserModel.query().select("artistId").where({ userId: user.id }));
    }

    if (q) {
      void query.where(raw('lower("name")'), "like", `%${q.toLowerCase()}%`);
    }

    return query.page(page, limit);
  }

  async getArtist(id: number) {
    return ArtistModel.query().where({ id }).first();
  }

  async addArtist(data: ModelObject<ArtistModel>) {
    return ArtistModel.query().insertAndFetch(data);
  }

  async syncArtists(artists: Array<ModelObject<ArtistModel>>) {
    return ArtistModel.transaction(async (trx) => {
      await ArtistModel.query().delete().transacting(trx);
      return ArtistModel.query().insertGraph(artists).transacting(trx);
    });
  }

  async deleteArtist(id: number) {
    return ArtistModel.query().delete().where({ id });
  }
}

export const artistRepository = new ArtistRepository();
