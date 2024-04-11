import { BaseService } from "#src/apps/admin/services/common/base-service.ts";

class ArtistsService extends BaseService {
  getArtists(
    { q, page, limit, signal }: {
      q?: string;
      page?: number;
      limit?: number;
      signal: AbortSignal;
    },
  ) {
    const query: Record<string, string> = {};

    if (q) query.q = q;
    if (page) query.page = String(page);
    if (limit) query.limit = String(limit);

    return this.request({
      path: `/api/artists${Object.keys(query).length > 0 ? "?" : ""}${
        new URLSearchParams(query).toString()
      }`,
      init: { signal },
    });
  }

  import(
    { body, headers, signal }: {
      body: ReadableStream;
      headers: { "content-type": string; "content-length": string };
      signal: AbortSignal;
    },
  ) {
    return this.request({
      path: "/api/artists/import",
      init: { method: "POST", headers, body, signal },
    });
  }

  export({ signal }: { signal: AbortSignal }) {
    return this.request({
      path: "/api/artists/export",
      init: { signal },
      sendResponse: true,
    });
  }

  searchRemote({ q, signal }: { signal: AbortSignal; q: string }) {
    return this.request({
      path: `/api/artists/remote?q=${q}`,
      init: { signal },
    });
  }

  subscribe(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/artists",
      init: {
        method: "POST",
        signal,
        body: JSON.stringify(data),
        headers: { "content-type": "application/json" },
      },
    });
  }

  unsubscribe({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({
      path: `/api/artists/${id}`,
      init: { method: "DELETE", signal },
    });
  }
}

export default ArtistsService;
