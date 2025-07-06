import type { FC } from "@hono/hono/jsx";
import type { Release } from "#src/database/types/mod.ts";
import type { SessionFlashFormErrors } from "#src/apps/web/types.ts";

type ReleasesIndexPage = {
  releases: Release[];
  pagination: {
    currentUrl: string;
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
  formErrors?: SessionFlashFormErrors | undefined;
};

export const ReleasesIndexPage: FC<ReleasesIndexPage> = (
  { releases, pagination, formErrors },
) => (
  <>
    <header
      class="mx-auto my-3 position-sticky z-2 mb-5"
      style={{ top: "1rem" }}
    >
      <div class="container">
        <div class="row">
          <div class="col">
            <div class="card px-3 py-4">
              <div calss="card-body">
                <form
                  class="row g-2 justify-content-center mb-3"
                  action={new URL(pagination.currentUrl).pathname}
                  method="get"
                >
                  {new URL(pagination.currentUrl).searchParams.has("page")
                    ? (
                      <input
                        type="hidden"
                        name="page"
                        value={new URL(
                          pagination.currentUrl,
                        ).searchParams.get("page")!}
                      />
                    )
                    : undefined}
                  {new URL(pagination.currentUrl).searchParams.has("limit")
                    ? (
                      <input
                        type="hidden"
                        name="limit"
                        value={new URL(
                          pagination.currentUrl,
                        ).searchParams.get("limit")!}
                      />
                    )
                    : undefined}

                  <div class="col-auto">
                    <input
                      class={`form-control ${
                        formErrors?.q ? "is-invalid" : ""
                      }`}
                      type="text"
                      name="q"
                      placeholder="Search release"
                      value={new URL(pagination.currentUrl).searchParams.has(
                          "q",
                        )
                        ? new URL(pagination.currentUrl).searchParams.get("q")!
                        : ""}
                    />
                    {formErrors?.q
                      ? (
                        <div class="invalid-feedback">
                          {formErrors.q.map((item, i) => <p key={i}>{item}</p>)}
                        </div>
                      )
                      : null}
                  </div>

                  <div class="col-auto">
                    <select
                      name="hidden"
                      class={`form-control ${
                        formErrors?.hidden ? "is-invalid" : ""
                      }`}
                    >
                      <option value="none">Filter hidden mode</option>
                      <option
                        value="admin"
                        selected={new URL(pagination.currentUrl).searchParams
                          .get(
                            "hidden",
                          ) ===
                          "admin"}
                      >
                        Admin
                      </option>
                      <option
                        value="feed"
                        selected={new URL(pagination.currentUrl).searchParams
                          .get(
                            "hidden",
                          ) === "feed"}
                      >
                        Feed
                      </option>
                    </select>
                    {formErrors?.hidden
                      ? (
                        <div class="invalid-feedback">
                          {formErrors.hidden.map((item, i) => (
                            <p key={i}>{item}</p>
                          ))}
                        </div>
                      )
                      : null}
                  </div>

                  <div class="col-auto">
                    <button type="submit" class="btn btn-outline-primary">
                      Search <i class="bi bi-search"></i>
                    </button>
                  </div>
                </form>

                <div class="d-flex justify-content-center mb-2">
                  <a
                    class="btn btn-sm btn-outline-primary me-2"
                    href={pagination.startLink}
                  >
                    <i class="bi bi-chevron-double-left"></i> Start
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary me-2"
                    href={pagination.previousLink}
                  >
                    <i class="bi bi-chevron-left"></i> Previous
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary me-2"
                    href={pagination.nextLink}
                  >
                    Next <i class="bi bi-chevron-right"></i>
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary"
                    href={pagination.endLink}
                  >
                    End <i class="bi bi-chevron-double-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main>
      <div class="container">
        <div class="row">
          {releases.length <= 0
            ? <p class="text-center">No releases to show</p>
            : null}
          {releases.map(
            (release) => (
              <div class="col-12">
                <section class="mb-4 text-center text-md-start d-block d-md-flex">
                  <img
                    class="img-fluid rounded me-md-5 mb-2 mb-md-0"
                    src={release.coverUrl}
                    style={{ aspectRatio: "1 / 1", maxWidth: "250px" }}
                  />

                  <div>
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

                    <h3>{release.name} by {release.artistName}</h3>

                    <p>
                      Released at{" "}
                      {new Date(release.releasedAt).toLocaleString()}
                    </p>

                    <a
                      class="btn btn-outline-primary"
                      href={`/releases/${release.id}/${release.type}`}
                    >
                      More
                    </a>
                  </div>
                </section>

                <hr />
              </div>
            ),
          )}
        </div>
      </div>
    </main>
  </>
);
