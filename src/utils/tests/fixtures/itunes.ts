import {
  type ItunesArtistSearchModel,
  type ItunesLookupAlbumModel,
  type ItunesLookupSongModel,
} from "#src/remote/itunes/types.js";

export const loadItunesLookupSong = (data: Partial<ItunesLookupSongModel> = {}) => ({
  wrapperType: "track",
  kind: "song",
  artistId: 567_072,
  collectionId: 1_641_561_652,
  trackId: 1_641_561_672,
  artistName: "Gorillaz",
  collectionName: "Cracker Island",
  trackName: "New Gold (feat. Tame Impala and Bootie Brown)",
  collectionCensoredName: "Cracker Island",
  trackCensoredName: "New Gold (feat. Tame Impala and Bootie Brown)",
  artistViewUrl: "https://music.apple.com/us/artist/gorillaz/567072?uo=4",
  collectionViewUrl:
    "https://music.apple.com/us/album/new-gold-feat-tame-impala-and-bootie-brown/1641561652?i=1641561672&uo=4",
  trackViewUrl:
    "https://music.apple.com/us/album/new-gold-feat-tame-impala-and-bootie-brown/1641561652?i=1641561672&uo=4",
  previewUrl:
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/34/0e/fb/340efb36-73d6-0c0d-9a87-04c43bfd172b/mzaf_17036525489323340369.plus.aac.p.m4a",
  artworkUrl30:
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b3/b9/bb/b3b9bbdf-8d38-661e-f70b-2eb5e9765bb7/5054197315893.jpg/30x30bb.jpg",
  artworkUrl60:
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b3/b9/bb/b3b9bbdf-8d38-661e-f70b-2eb5e9765bb7/5054197315893.jpg/60x60bb.jpg",
  artworkUrl100:
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b3/b9/bb/b3b9bbdf-8d38-661e-f70b-2eb5e9765bb7/5054197315893.jpg/100x100bb.jpg",
  trackPrice: 1.29,
  collectionExplicitness: "explicit",
  trackExplicitness: "explicit",
  discCount: 1,
  discNumber: 1,
  trackCount: 11,
  trackNumber: 5,
  trackTimeMillis: 215_150,
  country: "USA",
  currency: "USD",
  primaryGenreName: "Alternative",
  contentAdvisoryRating: "Explicit",
  isStreamable: true,
  ...data,
});

export const loadItunesLookupAlbum = (data: Partial<ItunesLookupAlbumModel> = {}) => ({
  wrapperType: "collection",
  collectionType: "Album",
  artistId: 567_072,
  collectionId: 1_641_561_652,
  amgArtistId: 476_055,
  artistName: "Gorillaz",
  collectionName: "Cracker Island",
  collectionCensoredName: "Cracker Island",
  artistViewUrl: "https://music.apple.com/us/artist/gorillaz/567072?uo=4",
  collectionViewUrl: "https://music.apple.com/us/album/cracker-island/1641561652?uo=4",
  artworkUrl60:
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b3/b9/bb/b3b9bbdf-8d38-661e-f70b-2eb5e9765bb7/5054197315893.jpg/60x60bb.jpg",
  artworkUrl100:
    "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b3/b9/bb/b3b9bbdf-8d38-661e-f70b-2eb5e9765bb7/5054197315893.jpg/100x100bb.jpg",
  collectionExplicitness: "explicit",
  contentAdvisoryRating: "Explicit",
  trackCount: 11,
  copyright: "℗ 2023 Parlophone Records Limited.",
  country: "USA",
  currency: "USD",
  releaseDate: "2023-02-24T08:00:00Z",
  primaryGenreName: "Alternative",
  ...data,
});

export const loadItunesSearchArtist = (data: Partial<ItunesArtistSearchModel> = {}) => ({
  wrapperType: "artist",
  artistType: "Artist",
  artistName: "Foo Fighters",
  artistLinkUrl: "https://music.apple.com/us/artist/foo-fighters/6906197?uo=4",
  artistId: 6_906_197,
  amgArtistId: 144_725,
  primaryGenreName: "Rock",
  primaryGenreId: 21,
  ...data,
});
