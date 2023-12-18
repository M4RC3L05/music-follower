import { type Artist, type Release } from "#src/database/mod.js";
import { type ItunesArtistSearchModel } from "#src/remote/mod.js";
import config from "./config.js";

export const paths = {
  artists: {
    import: `${config.api.url}/api/artists/import`,
    export: `${config.api.url}/api/artists/export`,
    getArtists: `${config.api.url}/api/artists`,
    getRemoteArtists: `${config.api.url}/api/artists/remote`,
    subscribeArtist: `${config.api.url}/api/artists`,
    unsubscribeArtist: `${config.api.url}/api/artists/:id`,
  },
  releases: {
    getReleases: `${config.api.url}/api/releases`,
    getRelease: `${config.api.url}/api/releases/:id`,
    updateRelease: `${config.api.url}/api/releases/:id`,
  },
};

export type ResponseBodyError = { error: Record<string, unknown> };
export type ResponseBody<T = any> = { data: T } & ResponseBodyError;

export const makeRequester = async <T>(input: string, options: RequestInit = {}) => {
  const url = new URL(input, config.api.url);

  return fetch(url.toString(), {
    ...options,
    headers: {
      ...options.headers,
      authorization: `Basic ${globalThis.btoa(`${config.api.auth.name}:${config.api.auth.pass}`)}`,
    },
  }).then(async (response) => {
    if (response.status === 204) {
      return undefined;
    }

    return response.json();
  }) as Promise<T extends undefined ? undefined | { error: Record<string, unknown> } : ResponseBody<T>>;
};

type GetArtistsArgs = {
  cancel?: AbortSignal;
  query?: string;
  page?: string;
  limit?: string;
};

type GetRemoteArtistsArgs = {
  cancel?: AbortSignal;
  query?: string;
};

type SubscribeArtistArgs = {
  cancel?: AbortSignal;
  body: {
    id: string;
    name: string;
    image: string;
  };
};

type UnsubscribeArtistArg = {
  cancel?: AbortSignal;
  id: string;
};

type GetReleasesArgs = {
  cancel?: AbortSignal;
  query?: string;
  page?: string;
  limit?: string;
  hidden?: string;
};

type UpdateReleaseArgs = {
  cancel?: AbortSignal;
  body: {
    hidden: string[];
  };
  id: string;
};

export const requests = {
  artists: {
    async import({ cancel, body }: { cancel?: AbortSignal; body: FormData }) {
      return makeRequester<void>(paths.artists.import, {
        signal: cancel,
        method: "POST",
        body,
      });
    },
    async getArtists({ cancel, query, page, limit }: GetArtistsArgs) {
      const requestUrl = new URL(paths.artists.getArtists);

      if (query) requestUrl.searchParams.set("q", query);
      if (page) requestUrl.searchParams.set("page", page);
      if (limit) requestUrl.searchParams.set("limit", limit);

      return makeRequester<Artist[]>(requestUrl.toString(), { signal: cancel });
    },
    async getRemoteArtists({ cancel, query }: GetRemoteArtistsArgs) {
      const requestUrl = new URL(paths.artists.getRemoteArtists);

      if (query) requestUrl.searchParams.set("q", query);

      return makeRequester<ItunesArtistSearchModel[]>(requestUrl.toString(), { signal: cancel })!;
    },
    subscribeArtist: async ({ cancel, body }: SubscribeArtistArgs) =>
      makeRequester<undefined>(paths.artists.subscribeArtist, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    unsubscribeArtist: async ({ cancel, id }: UnsubscribeArtistArg) =>
      makeRequester<undefined>(paths.artists.unsubscribeArtist.replace(":id", String(id)), {
        signal: cancel,
        method: "DELETE",
      }),
  },
  releases: {
    async getReleases({ cancel, query, page, limit, hidden }: GetReleasesArgs) {
      const requestUrl = new URL(paths.releases.getReleases);

      if (query) requestUrl.searchParams.set("q", query);
      if (page) requestUrl.searchParams.set("page", page);
      if (limit) requestUrl.searchParams.set("limit", limit);
      if (hidden) requestUrl.searchParams.set("hidden", hidden);

      if (!hidden) requestUrl.searchParams.set("notHidden", "admin");

      return makeRequester<Release[]>(requestUrl.toString(), { signal: cancel });
    },
    async updateRelease({ cancel, body, id }: UpdateReleaseArgs) {
      return makeRequester<undefined>(paths.releases.getRelease.replace(":id", String(id)), {
        signal: cancel,
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      });
    },
  },
};
