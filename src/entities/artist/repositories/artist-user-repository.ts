import { makeLogger } from "#src/core/clients/logger.js";
import { ArtistUserModel } from "#src/entities/artist/models/artist-user-model.js";

const logger = makeLogger("artist-user-repository");

export class ArtistUserRepository {
  async subscribe(artistId: number, userId: number) {
    logger.info({ artistId, userId }, "Subscribing to artist");

    await ArtistUserModel.query().upsertGraph({ artistId, userId }, { insertMissing: true });
  }

  async unsubscribe(artistId: number, userId: number) {
    logger.info({ artistId, userId }, "Unsubscribing to artist");

    await ArtistUserModel.query().where({ artistId, userId }).delete();
  }

  async isSubscribed(artistId: number, userId: number) {
    return (await ArtistUserModel.query().where({ artistId, userId }).first()) instanceof ArtistUserModel;
  }
}

export const artistUserRepository = new ArtistUserRepository();
