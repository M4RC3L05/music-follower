import { BaseService } from "#src/apps/admin/services/common/base-service.ts";

class ReleasesService extends BaseService {
  getReleases(
    { q, hidden, notHidden, page, limit, signal }: {
      q?: string;
      hidden?: string;
      notHidden?: string;
      page?: number;
      limit?: number;
      signal: AbortSignal;
    },
  ) {
    const query: Record<string, string> = {};

    if (q) query.q = q;
    if (hidden) query.hidden = hidden;
    if (notHidden) query.notHidden = notHidden;
    if (page) query.page = String(page);
    if (limit) query.limit = String(limit);

    return this.request({
      path: `/api/releases${Object.keys(query).length > 0 ? "?" : ""}${
        new URLSearchParams(query).toString()
      }`,
      init: { signal },
    });
  }

  getRelease(
    { id, type, signal }: { id: string; type: string; signal: AbortSignal },
  ) {
    return this.request({
      path: `/api/releases/${id}/${type}`,
      init: { signal },
    });
  }

  updateRelease(
    { id, type, hidden, signal }: {
      id: string;
      type: string;
      hidden: ("feed" | "admin")[];
      signal: AbortSignal;
    },
  ) {
    return this.request({
      path: `/api/releases/${id}/${type}`,
      init: {
        method: "PATCH",
        body: JSON.stringify({ hidden }),
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }
}

export default ReleasesService;
