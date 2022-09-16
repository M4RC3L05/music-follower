import type Objection from "objection";
import { Model } from "objection";

export type TrackMetadata = {
  wrapperType: string;
  kind: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  collectionArtistId: number;
  collectionArtistName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl30: string;
  artworkUrl60: string;
  artworkUrl100: string;
  releaseDate: Date;
  collectionExplicitness: string;
  trackExplicitness: string;
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;
  country: string;
  currency: string;
  primaryGenreName: string;
  contentAdvisoryRating: string;
  isStreamable: boolean;
  trackPrice?: number;
};

export type CollectionMetadata = {
  wrapperType: string;
  collectionType: string;
  artistId: number;
  collectionId: number;
  amgArtistId: number;
  artistName: string;
  collectionName: string;
  collectionCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionExplicitness: string;
  contentAdvisoryRating: string;
  trackCount: number;
  copyright: string;
  country: string;
  currency: string;
  releaseDate: Date;
  primaryGenreName: string;
  collectionPrice?: number;
};

export class ReleaseModel extends Model {
  static tableName = "releases";

  id!: number;
  artistName!: string;
  name!: string;
  releasedAt!: Date;
  coverUrl!: string;
  type!: "collection" | "track";
  metadata!: TrackMetadata | CollectionMetadata;

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

    if (json.metadata !== null && json.metadata !== undefined) {
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
