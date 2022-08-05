import Objection, { Model } from "objection";

export class ReleaseModel extends Model {
  static tableName = "releases";

  id!: number;
  artistName!: string;
  name!: string;
  releasedAt!: Date;
  coverUrl!: string;

  $beforeUpdate() {
    if (this.releasedAt) {
      this.releasedAt = new Date(this.releasedAt).toISOString() as any;
    }
  }

  $parseDatabaseJson(json: Objection.Pojo) {
    json = super.$parseDatabaseJson(json);

    if (json.releasedAt !== null && json.releasedAt !== undefined) {
      json.releasedAt = new Date(json.releasedAt as string);
    }

    return json;
  }

  $formatDatabaseJson(json: Objection.Pojo) {
    json = super.$formatDatabaseJson(json);

    if (json.releasedAt !== null && json.releasedAt !== undefined) {
      json.releasedAt = new Date(json.releasedAt as string).toISOString();
    }

    return json;
  }
}
