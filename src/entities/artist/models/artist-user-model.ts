import { Model } from "objection";

export class ArtistUserModel extends Model {
  static tableName = "artists_users";
  static idColumn = ["userId", "artistId"];

  artistId!: number;
  userId!: number;
}
