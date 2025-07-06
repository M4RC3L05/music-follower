import type { CustomDatabase } from "#src/database/mod.ts";
import type { Artist, Release } from "#src/database/types/mod.ts";
import type {
  ItunesArtistSearchModel,
  ItunesLookupAlbumModel,
  ItunesLookupSongModel,
} from "#src/remote/mod.ts";

export const loadRelease = (db: CustomDatabase, data?: Partial<Release>) => {
  return db.sql<Release>`
    insert into releases (
      id, "artistName", name, "releasedAt", "coverUrl", type, metadata, "feedAt", hidden
    )
    values (
      ${
    data?.id ?? Number(Math.random().toFixed(7).toString().replace("0.", ""))
  },
      ${data?.artistName ?? "foo"},
      ${data?.name ?? "bar"},
      ${data?.releasedAt ?? null},
      ${data?.coverUrl ?? "http://example.com"},
      ${data?.type ?? "track"},
      ${data?.metadata ?? "{}"},
      ${data?.feedAt ?? new Date().toISOString()},
      ${data?.hidden ?? "[]"}
    )
    returning *
  `.at(0)!;
};

export const loadArtist = (db: CustomDatabase, data?: Partial<Artist>) => {
  return db.sql<Artist>`
    insert into artists (id, name, image)
    values (
      ${
    data?.id ?? Number(Math.random().toFixed(7).toString().replace("0.", ""))
  },
      ${data?.name ?? "foo"},
      ${data?.image ?? "http://example.com"}
    )
    returning *
  `.at(0)!;
};

export const maxArtistsImportPayload = new File(
  ["0".repeat((1024 * 1024 * 3) + 1)],
  "foo.json",
  {
    type: "text/plain",
  },
);

export const generateArtistsFileExport = (artists?: Artist[]) => {
  return new File(
    [JSON.stringify({ data: artists ?? [] })],
    "foo.json",
    {
      type: "text/plain",
    },
  );
};

export const generateItunesArtistsSearchResultItem = (
  artist?: Partial<ItunesArtistSearchModel>,
): ItunesArtistSearchModel => {
  const id = Math.floor(Math.random() * 1000000);

  return {
    wrapperType: "artist",
    artistType: "individual",
    artistName: "Example artist",
    artistLinkUrl: `https://music.apple.com/artist/example-artist/${id}`,
    artistId: id,
    amgArtistId: 123456,
    primaryGenreName: "Pop",
    primaryGenreId: 14,
    ...(artist ?? {}),
  };
};

export const generateItunesArtistsSearchResult = (
  ...artist: Partial<ItunesArtistSearchModel>[]
) => {
  return {
    resultCount: artist.length,
    results: artist.map((item) => generateItunesArtistsSearchResultItem(item)),
  };
};

export const generateItunesSongLookupResultItem = (
  lookupSong?: Partial<ItunesLookupSongModel>,
): ItunesLookupSongModel => {
  const id = Math.floor(Math.random() * 1000000);
  const collectionId = Math.floor(Math.random() * 1000000);
  const artistId = Math.floor(Math.random() * 1000000);

  return {
    wrapperType: "track",
    kind: "song",
    artistId,
    collectionId,
    trackId: id,
    artistName: "Example Artist",
    collectionName: "Example Album",
    trackName: "Example Song",
    collectionCensoredName: "Example Album",
    trackCensoredName: "Example Song",
    artistViewUrl: "https://example.com/artist",
    collectionViewUrl: "https://example.com/album",
    trackViewUrl: "https://example.com/song",
    previewUrl: "https://example.com/preview",
    artworkUrl30: "https://example.com/artwork30.jpg",
    artworkUrl60: "https://example.com/artwork60.jpg",
    artworkUrl100: "https://example.com/artwork100.jpg",
    releaseDate: new Date().toISOString(),
    collectionExplicitness: "notExplicit",
    trackExplicitness: "notExplicit",
    discCount: 1,
    discNumber: 1,
    trackCount: 10,
    trackNumber: 1,
    trackTimeMillis: 180000,
    country: "US",
    currency: "USD",
    primaryGenreName: "Pop",
    isStreamable: true,
    ...(lookupSong ?? {}),
  };
};

export const generateItunesAlbumLookupResultItem = (
  lookupAlbum?: Partial<ItunesLookupAlbumModel>,
): ItunesLookupAlbumModel => {
  const id = Math.floor(Math.random() * 1000000);
  const artistId = Math.floor(Math.random() * 1000000);

  return {
    wrapperType: "collection",
    collectionType: "Album",
    artistId,
    collectionId: id,
    artistName: "Example Artist",
    collectionName: "Example Album",
    collectionCensoredName: "Example Album",
    artistViewUrl: "https://example.com/artist",
    collectionViewUrl: "https://example.com/album",
    artworkUrl60: "https://example.com/artwork60.jpg",
    artworkUrl100: "https://example.com/artwork100.jpg",
    collectionPrice: 9.99,
    collectionExplicitness: "notExplicit",
    trackCount: 10,
    copyright: "© 2023 Example Artist",
    country: "US",
    currency: "USD",
    releaseDate: new Date().toISOString(),
    primaryGenreName: "Pop",
    ...(lookupAlbum ?? {}),
  };
};

export const generateItunesArtistLatestReleasesResult = <
  T extends "song" | "album",
>(
  type: T,
  ...data: Array<
    T extends "song" ? Partial<ItunesLookupSongModel>
      : T extends "album" ? Partial<ItunesLookupAlbumModel>
      : never
  >
) => {
  const generator = type === "song"
    ? generateItunesSongLookupResultItem
    : generateItunesAlbumLookupResultItem;

  return {
    resultCount: data.length,
    results: [
      generateItunesArtistsSearchResultItem(),
      ...data.map((item) =>
        generator(
          item as
            | (
              & Partial<ItunesLookupSongModel>
              & Partial<ItunesLookupAlbumModel>
            )
            | undefined,
        )
      ),
    ],
  };
};
