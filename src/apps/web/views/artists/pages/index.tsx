import type { FC } from "@hono/hono/jsx";
import type { Artist } from "#src/database/types/mod.ts";
import { SessionFlashFormErrors } from "#src/apps/web/types.ts";

type ArtistsIndexPageProps = {
  artists: Artist[];
  pagination: {
    currentUrl: string;
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
  formErrors?: SessionFlashFormErrors | undefined;
};

const ArtistSection: FC<{ artist: Artist }> = ({ artist }) => (
  <>
    <section class="mb-4 text-center text-sm-start d-block d-sm-flex">
      <img
        class="img-fluid rounded me-sm-5"
        src={artist.image}
        style="aspect-ratio: 1 / 1"
      />

      <div>
        <h3 class="mt-sm-0 mt-2">{artist.name}</h3>

        <div
          class="modal fade"
          id={`unsub-artist-modal-${artist.id}`}
          tabindex={-1}
          aria-labelledby={`unsub-artist-modal-${artist.id}`}
          aria-hidden="true"
        >
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h1 class="modal-title fs-5">
                  Confirm unsubscribe from{" "}
                  <em>
                    <b>{artist.name}</b>
                  </em>
                </h1>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                </button>
              </div>
              <div class="modal-body">
                Are you sure you want to unsubscribe from{" "}
                <em>
                  <b>{artist.name}</b>
                </em>?
              </div>
              <div class="modal-footer">
                <form
                  action={`/artists/${artist.id}/unsubscribe`}
                  method="post"
                >
                  <button type="submit" class="btn btn-outline-primary">
                    Yes
                  </button>
                </form>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          class="btn btn-outline-warning d-inline"
          type="button"
          data-bs-toggle="modal"
          data-bs-target={`#unsub-artist-modal-${artist.id}`}
        >
          Unsubscribe ⨯?
        </button>
      </div>
    </section>

    <hr />
  </>
);

export const ArtistsIndexPage: FC<ArtistsIndexPageProps> = (
  { artists, pagination, formErrors },
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
                        class="form-control"
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
                        class="form-control"
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
                      placeholder="Search subscribed artists"
                      value={new URL(pagination.currentUrl).searchParams.has(
                          "q",
                        )
                        ? new URL(pagination.currentUrl).searchParams.get("q")!
                        : ""}
                    />
                    {formErrors?.q
                      ? (
                        <div class="invalid-feedback">
                          {formErrors.q.map((item) => <p>{item}</p>)}
                        </div>
                      )
                      : null}
                  </div>

                  <div class="col-auto">
                    <button type="submit" class="btn btn-outline-primary">
                      Search
                    </button>
                  </div>
                </form>

                <div class="d-flex justify-content-center mb-2">
                  <a
                    href="/artists/remote"
                    class="btn btn-sm btn-outline-primary me-2"
                  >
                    Find artists
                  </a>
                  <a
                    href="/artists/import"
                    class="btn btn-sm btn-outline-primary me-2"
                  >
                    Import ↥
                  </a>
                  <a
                    href="/artists/export"
                    target="_blank"
                    class="btn btn-sm btn-outline-primary"
                  >
                    Export ↧
                  </a>
                </div>

                <div class="d-flex justify-content-center">
                  <a
                    class="btn btn-sm btn-outline-primary me-2"
                    href={pagination.startLink}
                  >
                    « Start
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary me-2"
                    href={pagination.previousLink}
                  >
                    ← Previous
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary me-2"
                    href={pagination.nextLink}
                  >
                    Next →
                  </a>
                  <a
                    class="btn btn-sm btn-outline-primary"
                    href={pagination.endLink}
                  >
                    End »
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
        <div className="row">
          {artists.length <= 0
            ? <p class="text-center">No releases to show</p>
            : null}
          {artists.map((artist) => (
            <div class="col-12">
              <ArtistSection
                key={artist.id}
                artist={artist}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  </>
);
