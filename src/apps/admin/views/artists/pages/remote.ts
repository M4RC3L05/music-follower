import { html } from "hono/html";
import { ItunesArtistSearchModel } from "#src/remote/mod.js";
import { layouts } from "../../common/mod.js";
import { Navbar } from "../../common/partials/mod.js";

const ArtistsRemotePage = ({
  remoteArtists,
}: {
  remoteArtists: (ItunesArtistSearchModel & {
    image: string;
    isSubscribed: boolean;
  })[];
}) => html`
  <header>
    ${Navbar()}

    <h1>Search artists to follow</h1>
  </header>

  <main>
    <section>
      <form id="search-remote-form" action="/artists/remote" method="GET" class="text-align: center">
        <div>
          <label for="q">Artists name</label>
          <input type="text" id="q" name="q" placeholder="Artists name" required />
        </div>

        <button type="submit">
          Search
        </button>
      </form>
    </section>

    ${
      remoteArtists.length > 0
        ? html`
            <section>
              ${remoteArtists.map(
                (remoteArtist) => html`
                <section style="overflow: auto;">
                  <aside>
                    <img src="${remoteArtist.image}" style="width: 100%; height: auto; aspect-ratio: 1 / 1" />
                  </aside>

                  <h3 style="margin-top: 0px">${remoteArtist.artistName}</h3>

                  <form
                    hx-post="/artists/remote"
                    hx-swap="none"
                    hx-on::after-on-load="this.querySelector('button').disabled = true"
                  >
                    <input type="hidden" name="name" value="${
                      remoteArtist.artistName
                    }" />
                    <input type="hidden" name="id" value="${
                      remoteArtist.artistId
                    }" />
                    <input type="hidden" name="image" value="${
                      remoteArtist.image
                    }" />

                    <button ${remoteArtist.isSubscribed ? "disabled" : ""}>
                      Subscribe
                    </button>
                  </form>
                </section>
              `,
              )}
            </section>
          `
        : null
    }
  </main>
`;

export default layouts.MainLayout({
  Body: ArtistsRemotePage,
  Scripts: [
    () => html`
      <script type="module">
        const form = document.querySelector("#search-remote-form");

        let abort;

        form.addEventListener("submit", (event) => {
          event.preventDefault();
          const params = new URLSearchParams(new FormData(event.target));
          const url = new URL(window.location);

          for (const [key, value] of params.entries()) {
            url.searchParams.set(key, value);
          }

          replaceAndReload(url.toString())
        })
      </script>
    `,
    () => html`<script src="/deps/htmx.org/dist/htmx.min.js"></script>`,
  ],
});
