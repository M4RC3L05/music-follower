import config from "./config.js";

export const paths = {
  artists: {
    getArtists: `${config.api.url}/api/artists`,
    getRemoteArtists: `${config.api.url}/api/artists/remote`,
    subscribeArtist: `${config.api.url}/api/artists`,
    unsubscribeArtist: `${config.api.url}/api/artists/:id`,
  },
  releases: {
    getReleases: `${config.api.url}/api/releases`,
    getRelease: `${config.api.url}/api/releases/:id`,
  },
};

export const makeRequester = async (input, options = {}) => {
  const url = new URL(input, config.api.url);

  return fetch(url.toString(), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Basic ${globalThis.btoa(`${config.api.auth.name}:${config.api.auth.pass}`)}`,
    },
  }).then((response) => {
    if (response.status === 204) {
      return undefined;
    }

    return response.json();
  });
};

export const requests = {
  artists: {
    getArtists({ cancel, query, page, limit }) {
      const requestUrl = new URL(paths.artists.getArtists);

      if (query) requestUrl.searchParams.set("q", query);
      if (page) requestUrl.searchParams.set("page", page);
      if (limit) requestUrl.searchParams.set("limit", limit);

      return makeRequester(requestUrl.toString(), { signal: cancel });
    },
    getRemoteArtists({ cancel, query }) {
      const requestUrl = new URL(paths.artists.getRemoteArtists);

      if (query) requestUrl.searchParams.set("q", query);

      return makeRequester(requestUrl.toString(), { signal: cancel });
    },
    subscribeArtist: ({ cancel, body } = {}) =>
      makeRequester(paths.artists.subscribeArtist, {
        signal: cancel,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      }),
    unsubscribeArtist: ({ cancel, id } = {}) =>
      makeRequester(paths.artists.unsubscribeArtist.replace(":id", id), {
        signal: cancel,
        method: "DELETE",
      }),
  },
  releases: {
    getReleases({ cancel, query, page, limit }) {
      const requestUrl = new URL(paths.releases.getReleases);

      if (query) requestUrl.searchParams.set("q", query);
      if (page) requestUrl.searchParams.set("page", page);
      if (limit) requestUrl.searchParams.set("limit", limit);

      return makeRequester(requestUrl.toString(), { signal: cancel });
    },
    getRelease: ({ cancel, id }) => makeRequester(paths.releases.getRelease.replace(":id", id), { signal: cancel }),
  },
};
