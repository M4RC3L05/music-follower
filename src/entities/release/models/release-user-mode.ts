import { Model } from "objection";

export class ReleaseUserModel extends Model {
  static tableName = "releases_users";
  static idColumn = ["userId", "releaseId", "releaseType"];

  userId!: number;
  releaseId!: number;
  releaseType!: "collection" | "track";
}
