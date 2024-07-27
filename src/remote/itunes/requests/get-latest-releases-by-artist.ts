import config from "config";
import { Requester } from "@m4rc3l05/requester";
import * as requesterComposers from "@m4rc3l05/requester/composers";
import type {
  ItunesLookupAlbumModel,
  ItunesLookupSongModel,
  ItunesResponseModel,
} from "#src/remote/itunes/types.ts";

const itunesLookupConfig = config.get<ItunesLookupConfig>(
  "remote.itunes.lookup",
);

type ItunesLookupConfig = {
  url: string;
  getLatestsArtistMusicReleases: { limit: number };
  getLatestsArtistAlbumReleases: { limit: number };
};

const requester = new Requester().with(
  requesterComposers.timeout({ ms: 10000 }),
  requesterComposers.skip({ n: 1 }, requesterComposers.delay({ ms: 2000 })),
  requesterComposers.retry({
    maxRetries: 3,
    shouldRetry: ({ error }) => !!error && !["AbortError"].includes(error.name),
  }),
);

export const getLatestReleasesByArtist = async <E extends "song" | "album">(
  artistId: number,
  entity: E,
  signal?: AbortSignal,
): Promise<
  ItunesResponseModel<
    E extends "song" ? ItunesLookupSongModel
      : E extends "album" ? ItunesLookupAlbumModel
      : never
  >
> => {
  const path = new URL(itunesLookupConfig.url);
  path.searchParams.set("id", String(artistId));
  path.searchParams.set("entity", entity);
  path.searchParams.set("media", "music");
  path.searchParams.set("sort", "recent");
  path.searchParams.set(
    "limit",
    String(
      entity === "song"
        ? itunesLookupConfig.getLatestsArtistMusicReleases.limit
        : itunesLookupConfig.getLatestsArtistAlbumReleases.limit,
    ),
  );

  const response = await requester.fetch(path.toString(), { signal });

  if (!response.ok) {
    throw new Error("Error requesting lookup artists releases", {
      cause: response.status,
    });
  }

  const data = (await response.json()) as ItunesResponseModel<
    E extends "song" ? ItunesLookupSongModel
      : E extends "album" ? ItunesLookupAlbumModel
      : never
  >;

  // Remove artists info from results
  data.results.splice(0, 1);

  return data;
};
