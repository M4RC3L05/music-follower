import { html } from "hono/html";
import { Artist } from "#src/database/mod.js";
import { layouts } from "../../common/mod.js";
import { Navbar } from "../../common/partials/mod.js";

type ReleasesIndexPage = {
  artists: Artist[];
  pagination: {
    currentUrl: string;
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
};

const ArtistsIndexPage = ({ artists, pagination }: ReleasesIndexPage) => html`
  <header>
    ${Navbar()}

    <h1>Artists</h1>
  </header>

  <header style="position: sticky; top: 0; padding: 8px 0px; z-index: 2">
    <form
      id="header-actions"
      action=${new URL(pagination.currentUrl).pathname}
      method="get"
    >
      ${
        new URL(pagination.currentUrl).searchParams.has("page")
          ? html`<input type="hidden" name="page" value=${new URL(
              pagination.currentUrl,
            ).searchParams.get("page")} />`
          : html``
      }
      ${
        new URL(pagination.currentUrl).searchParams.has("limit")
          ? html`<input type="hidden" name="limit" value=${new URL(
              pagination.currentUrl,
            ).searchParams.get("limit")} />`
          : html``
      }
      <input type="text" name="q" placeholder="Search subscribed artists" value="${
        new URL(pagination.currentUrl).searchParams.has("q")
          ? new URL(pagination.currentUrl).searchParams.get("q")
          : ""
      }" />

      <button type="submit">
        Search
      </button>
    </form>


    <a href="/artists/remote" class="button" href=${pagination.startLink}>Find artists</a>
    <a href="/artists/import" class="button">Import ↥</a>
    <a href="/artists/export" target="__blank" class="button">Export ↧</a>

    <br />

    <a class="button" href=${pagination.startLink}>« Start</a>
    <a class="button" href=${pagination.previousLink}>← Previous</a>
    <a class="button" href=${pagination.nextLink}>Next →</a>
    <a class="button" href=${pagination.endLink}>End »</a>
  </header>

  <main>
    ${artists.map(
      (artist) => html`
        <section style="overflow: auto;">
          <aside>
            <img src=${artist.imageUrl} style="width: 100%; height: auto; aspect-ratio: 1 / 1" />
          </aside>

          <h3 style="margin-top: 0">${artist.name}</h3>

          <form
            hx-post="/artists/unsubscribe"
            hx-swap="none"
            hx-on::after-on-load="window.location.reload()"
          >
            <input type="hidden" name="id" value="${artist.id}" />
            <button>
              Unsubscribe
            </button>
          </form>
        </section>
      `,
    )}
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () => html`
      <style>
        #header-actions button,.button, input, select {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
    `,
  ],
  Body: ArtistsIndexPage,
  Scripts: [
    () =>
      html`<script type="module">window.scrollTo({ top: 0, left: 0, behavior: "instant" })</script>`,
    () => html`
      <script type="module">
        document.getElementById("header-actions").addEventListener("submit", event => {
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
