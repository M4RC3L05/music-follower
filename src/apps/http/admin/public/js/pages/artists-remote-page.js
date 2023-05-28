import { requests } from "../common/request.js";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  return requests.artists.getRemoteArtists({ query });
};
