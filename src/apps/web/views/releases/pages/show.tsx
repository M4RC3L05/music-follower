import type { FC } from "@hono/hono/jsx";
import type { Release } from "#src/database/types/mod.ts";

type ReleasesShowPage = {
  release: Release;
};

export const ReleasesShowPage: FC<ReleasesShowPage> = ({ release }) => (
  <>
    <header
      class="mx-auto my-3 position-sticky z-2 mb-5"
      style={{ top: "1rem" }}
    >
      <div class="container">
        <div class="row">
          <div class="col">
            <div class="card px-3 py-4">
              <div class="card-body d-flex justify-content-center align-items-center">
                <form
                  action={`/releases/${release.id}/${release.type}/state`}
                  method="post"
                  style="margin-right: 8px"
                >
                  <input type="hidden" name="option" value="admin" />
                  <input
                    class="form-control"
                    type="hidden"
                    name="state"
                    value={release.hidden.includes("admin") ? "show" : "hide"}
                  />
                  <button type="submit" class="btn btn-outline-primary">
                    Hidden Admin {release.hidden.includes("admin")
                      ? <i class="bi bi-check-square"></i>
                      : <i class="bi bi-square"></i>}
                  </button>
                </form>

                <form
                  action={`/releases/${release.id}/${release.type}/state`}
                  method="post"
                >
                  <input type="hidden" name="option" value="feed" />
                  <input
                    class="form-control"
                    type="hidden"
                    name="state"
                    value={release.hidden.includes("feed") ? "show" : "hide"}
                  />
                  <button type="submit" class="btn btn-outline-primary">
                    Hidden Feed {release.hidden.includes("feed")
                      ? <i class="bi bi-check-square"></i>
                      : <i class="bi bi-square"></i>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main>
      <div class="container">
        <div class="row">
          <div class="col-12">
            <div style="display: flex; justify-content: center">
              <img
                class="img-fluid rounded mb-2"
                src={release.coverUrl}
                style={{ aspectRatio: "1 / 1" }}
              />
            </div>

            <h3>{release.name} by {release.artistName}</h3>

            {new Date(release.releasedAt).getTime() > Date.now()
              ? (
                <span class="badge rounded-pill text-bg-info me-2">
                  To be released
                </span>
              )
              : null}

            <span class="badge rounded-pill text-bg-primary mb-2">
              {release.type}
            </span>

            <p>
              Release date: {release?.releasedAt
                ? new Date(release.releasedAt).toISOString()
                : "N/A"}
            </p>

            {typeof (JSON.parse(release?.metadata ?? "{}") as Record<
                string,
                unknown
              >)
                ?.previewUrl === "string"
              ? (
                <audio
                  style="width: 100%"
                  src={(JSON.parse(release?.metadata ?? "{}") as Record<
                    string,
                    unknown
                  >)
                    .previewUrl as string}
                  controls
                >
                </audio>
              )
              : undefined}

            <h4>Metadata:</h4>
            <pre>
              {JSON.stringify(JSON.parse(release.metadata ?? "{}"), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </main>
  </>
);
