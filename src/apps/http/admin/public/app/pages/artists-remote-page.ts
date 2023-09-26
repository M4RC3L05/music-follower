import { type LoaderFunction } from "react-router-dom";

import { requests } from "../common/request.js";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? undefined;

  return requests.artists.getRemoteArtists({ query });
};
