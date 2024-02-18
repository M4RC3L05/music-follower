import { InferRequestType } from "hono/client";
import { client } from "../common/mod.js";

class ReleasesService {
  async getReleases({
    query,
  }: { query?: InferRequestType<typeof client.api.releases.$get>["query"] }) {
    const response = await client.api.releases.$get({ query: query ?? {} });

    return response.json();
  }

  async getRelease({ id, type }: { id: string; type: string }) {
    const response = await client.api.releases[":id"][":type"].$get({
      param: { id, type },
    });

    return response.json();
  }

  async updateRelease({
    id,
    type,
    hidden,
  }: { id: string; type: string; hidden: ("feed" | "admin")[] }) {
    await client.api.releases[":id"][":type"].$patch({
      param: { id, type },
      json: { hidden },
    });
  }
}

export default ReleasesService;
