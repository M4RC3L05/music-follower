import type { Readable } from "node:stream";
import config from "config";
import { InferRequestType } from "hono/client";
import { ItunesArtistSearchModel } from "#src/remote/mod.js";
import { client, serviceRequester } from "../common/mod.js";

const { url } = config.get<{ url: string }>("apps.admin.services.api");

class ArtistsService {
  async getArtists({
    query,
  }: { query?: InferRequestType<typeof client.api.artists.$get>["query"] }) {
    const response = await client.api.artists.$get({ query: query ?? {} });

    return response.json();
  }

  import({
    body,
    headers,
  }: {
    body: Readable;
    headers: { "content-type": string; "content-length": string };
  }) {
    return serviceRequester(`${url}/api/artists/import`, {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      body: body as any,
      method: "post",
      headers: headers,
    });
  }

  async export() {
    return client.api.artists.export.$get();
  }

  async searchRemote({
    query,
  }: {
    query?: InferRequestType<typeof client.api.artists.remote.$get>["query"];
  }) {
    const response = await client.api.artists.remote.$get({
      query: query ?? {},
    });

    return response.json() as Promise<{
      data: (ItunesArtistSearchModel & {
        image: string;
        isSubscribed: boolean;
      })[];
    }>;
  }

  async subscribe({
    json,
  }: { json: InferRequestType<typeof client.api.artists.$post>["json"] }) {
    return client.api.artists.$post({ json });
  }

  async unsubscribe({ id }: { id: string }) {
    return client.api.artists[":id"].$delete({ param: { id } });
  }
}

export default ArtistsService;
