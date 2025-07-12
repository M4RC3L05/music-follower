import type { FC } from "@hono/hono/jsx";
import type { ItunesArtistSearchModel } from "#src/remote/mod.ts";
import type { SessionFlashFormErrors } from "#src/apps/web/types.ts";

export const ArtistsRemotePage: FC<{
  formErrors?: SessionFlashFormErrors | undefined;
  remoteArtists: (ItunesArtistSearchModel & {
    image: string;
    isSubscribed: boolean;
  })[];
  q: string;
}> = ({
  formErrors,
  remoteArtists,
  q,
}) => (
  <>
    <main class="mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-6 offset-md-3">
            <form
              action="/artists/remote"
              method="get"
            >
              <div class="mb-3">
                <label for="q" class="form-label">Artists name</label>
                <input
                  class={`form-control ${formErrors?.q ? "is-invalid" : ""}`}
                  type="text"
                  id="q"
                  name="q"
                  placeholder="Artists name"
                  required
                  value={q}
                />
                {formErrors?.q
                  ? (
                    <div class="invalid-feedback">
                      {formErrors.q.map((item, i) => <p key={i}>{item}</p>)}
                    </div>
                  )
                  : null}
              </div>

              <div class="d-grid">
                <button type="submit" class="btn btn-outline-primary">
                  Search <i class="bi bi-search"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {q.length > 0 && remoteArtists.length <= 0
        ? <p class="text-center mt-5">No remote artists found</p>
        : undefined}

      {remoteArtists.length > 0
        ? (
          <div class="container mt-5">
            <div class="row">
              {remoteArtists.map(
                (remoteArtist) => (
                  <div class="col-12">
                    <section class="mb-4 text-center text-sm-start d-block d-sm-flex">
                      <img
                        class="img-fluid rounded me-sm-5"
                        src={remoteArtist.image}
                        style="aspect-ratio: 1 / 1"
                      />

                      <div>
                        <h3 lass="mt-sm-0 mt-2">
                          {remoteArtist.artistName}
                        </h3>

                        <form
                          action="/artists/remote"
                          method="post"
                        >
                          <input
                            type="hidden"
                            name="name"
                            value={remoteArtist.artistName}
                          />
                          <input
                            type="hidden"
                            name="id"
                            value={remoteArtist.artistId}
                          />
                          <input
                            type="hidden"
                            name="image"
                            value={remoteArtist.image}
                          />

                          <button
                            type="submit"
                            class="btn btn-outline-primary"
                            disabled={remoteArtist.isSubscribed}
                          >
                            Subscribe
                          </button>
                        </form>
                      </div>
                    </section>
                  </div>
                ),
              )}
            </div>
          </div>
        )
        : undefined}
    </main>
  </>
);
