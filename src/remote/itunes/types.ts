export type ItunesArtistSearchModel = {
  wrapperType: string;
  artistType: string;
  artistName: string;
  artistLinkUrl: string;
  artistId: number;
  amgArtistId: number;
  primaryGenreName: string;
  primaryGenreId: number;
};

export type ItunesLookupArtistModel = {
  wrapperType: "artist";
  artistType: "Artist";
  artistName: string;
  artistLinkUrl: string;
  artistId: number;
  amgArtistId: number;
  primaryGenreName: string;
  primaryGenreId: number;
};

export type ItunesLookupAlbumModel = {
  wrapperType: "collection";
  collectionType: "Album";
  artistId: number;
  collectionId: number;
  artistName: string;
  collectionName: string;
  collectionCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionPrice: number;
  collectionExplicitness: string;
  trackCount: number;
  copyright: string;
  country: string;
  currency: string;
  releaseDate: string;
  primaryGenreName: string;
  amgArtistId?: number;
};

export type ItunesLookupSongModel = {
  wrapperType: "track";
  kind: "song";
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  collectionArtistId?: number;
  collectionArtistName?: string;
  collectionArtistViewUrl?: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl30: string;
  artworkUrl60: string;
  artworkUrl100: string;
  releaseDate: string;
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
  isStreamable: boolean;
  collectionPrice?: number;
  trackPrice?: number;
};

export type ItunesResponseModel<T> = {
  resultCount: number;
  results: T[];
};
