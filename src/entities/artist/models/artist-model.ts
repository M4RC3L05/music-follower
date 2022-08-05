import { Model } from "objection";

export class ArtistModel extends Model {
  static tableName = "artists";

  id!: number;
  name!: string;
  imageUrl!: string;
}
