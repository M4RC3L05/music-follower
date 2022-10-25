import type Objection from "objection";
import { Model } from "objection";

import type { ItunesLookupAlbumModel } from "#src/data/itunes/models/itunes-lookup-album-model.js";
import type { ItunesLookupSongModel } from "#src/data/itunes/models/itunes-lookup-song-model.js";

export class ReleaseModel extends Model {
  static tableName = "releases";

  id!: number;
  artistName!: string;
  name!: string;
  releasedAt!: Date;
  coverUrl!: string;
  type!: "collection" | "track";
  metadata!: ItunesLookupSongModel | ItunesLookupAlbumModel;

  $beforeUpdate() {
    if (this.releasedAt) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.releasedAt = new Date(this.releasedAt).toISOString() as any;
    }
  }

  $parseDatabaseJson(json: Objection.Pojo) {
    json = super.$parseDatabaseJson(json);

    if (json.releasedAt !== null && json.releasedAt !== undefined) {
      json.releasedAt = new Date(json.releasedAt as string);
    }

    if (json.metadata !== null && json.metadata !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      json.metadata = JSON.parse(json.metadata as string);
    }

    return json;
  }

  $formatDatabaseJson(json: Objection.Pojo) {
    json = super.$formatDatabaseJson(json);

    if (json.releasedAt !== null && json.releasedAt !== undefined) {
      json.releasedAt = new Date(json.releasedAt as string).toISOString();
    }

    if (json.metadata !== null && json.metadata !== undefined) {
      json.metadata = JSON.stringify(json.metadata as string);
    }

    return json;
  }
}
