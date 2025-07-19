import vine from "@vinejs/vine";

const configSchema = vine.object({
  apps: vine.object({
    web: vine.object({
      host: vine.string(),
      port: vine.number(),
      basicAuth: vine.object({
        username: vine.string(),
        password: vine.string(),
      }),
      feed: vine.object({
        maxReleases: vine.number(),
      }),
    }),
    jobs: vine.object({
      syncReleases: vine.object({
        maxReleaseTime: vine.string(),
      }),
    }),
  }),
  database: vine.object({
    path: vine.string(),
  }),
  remote: vine.object({
    itunes: vine.object({
      search: vine.object({
        url: vine.string(),
        searchArtists: vine.object({
          limit: vine.number(),
        }),
      }),
      lookup: vine.object({
        url: vine.string(),
        getLatestsArtistMusicReleases: vine.object({
          limit: vine.number(),
        }),
        getLatestsArtistAlbumReleases: vine.object({
          limit: vine.number(),
        }),
      }),
    }),
  }),
  csrf: vine.object({
    origin: vine.string(),
  }),
  media: vine.object({
    remoteArtistsPlaceholderImage: vine.string(),
  }),
});
const configSchemaValidator = vine.compile(configSchema);

const config = await configSchemaValidator.validate({
  apps: {
    web: {
      host: Deno.env.get("APPS_WEB_HOST") ?? "127.0.0.1",
      port: Deno.env.get("APPS_WEB_PORT") ?? 4321,
      basicAuth: {
        username: Deno.env.get("APPS_WEB_BASIC_AUTH_USERNAME") ?? "foo",
        password: Deno.env.get("APPS_WEB_BASIC_AUTH_PASSWORD") ?? "bar",
      },
      feed: {
        maxReleases: Deno.env.get("APPS_WEB_FEED_MAX_RELEASES") ?? 50,
      },
    },
    jobs: {
      syncReleases: {
        maxReleaseTime: Deno.env.get("JOBS_SYNC_RELEASES_MAX_RELEASE_TIME") ??
          "1 year",
      },
    },
  },
  database: {
    path: Deno.env.get("DATABASE_PATH") ?? "./data/app.db",
  },
  remote: {
    itunes: {
      search: {
        url: Deno.env.get("REMOTE_ITUNES_SEARCH_URL") ??
          "https://itunes.apple.com/search",
        searchArtists: {
          limit: Deno.env.get("REMOTE_ITUNES_SEARCH_SEARCH_ARTISTS_LIMIT") ?? 8,
        },
      },
      lookup: {
        url: Deno.env.get("REMOTE_ITUNES_LOOKUP_URL") ??
          "https://itunes.apple.com/lookup",
        getLatestsArtistMusicReleases: {
          limit: Deno.env.get(
            "REMOTE_ITUNES_LOOKUP_URL_GET_LATESTS_ARTIST_MUSIC_RELEASES_LIMIT",
          ) ?? 70,
        },
        getLatestsArtistAlbumReleases: {
          limit: Deno.env.get(
            "REMOTE_ITUNES_LOOKUP_URL_GET_LATESTS_ARTIST_ALBUM_RELEASES_LIMIT",
          ) ?? 50,
        },
      },
    },
  },
  csrf: {
    origin: Deno.env.get("CSRF_ORIGIN") ?? "\\.*",
  },
  media: {
    remoteArtistsPlaceholderImage: Deno.env.get("MEDIA_PLACEHOLDER_IMAGE") ??
      "/public/images/remote-artist-image-default.svg",
  },
});

export default config;
