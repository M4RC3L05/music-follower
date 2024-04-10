import { html } from "hono/html";
import type { Artist } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/admin/views/common/mod.ts";
import { Navbar } from "#src/apps/admin/views/common/partials/mod.ts";

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

const ArtistsIndexPage = ({ artists, pagination }: ReleasesIndexPage) =>
  html`
  <header>
    ${Navbar()}

    <h1>Artists</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; padding: 8px 0px; z-index: 2">
    <form
      id="header-actions"
      action=${new URL(pagination.currentUrl).pathname}
      method="get"
    >
      ${
    new URL(pagination.currentUrl).searchParams.has("page")
      ? html`<input type="hidden" name="page" value="${new URL(
        pagination.currentUrl,
      ).searchParams.get("page")!}" />`
      : html``
  }
      ${
    new URL(pagination.currentUrl).searchParams.has("limit")
      ? html`<input type="hidden" name="limit" value="${new URL(
        pagination.currentUrl,
      ).searchParams.get("limit")!}" />`
      : html``
  }
      <input type="text" name="q" placeholder="Search subscribed artists" value="${
    new URL(pagination.currentUrl).searchParams.has("q")
      ? new URL(pagination.currentUrl).searchParams.get("q")!
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
    ${
    artists.map(
      (artist) =>
        html`
        <section style="overflow: auto;">
          <aside>
            <img src=${artist.imageUrl} style="width: 100%; height: auto; aspect-ratio: 1 / 1" />
          </aside>

          <h3 style="margin-top: 0">${artist.name}</h3>

          <div class="artist-actions">
            <dialog id="dialog-${artist.id}">
              <p>Are you sure you want to unsubscribe from "${artist.name}"?</p>

              <form
                style="display: inline; margin-right: 8px"
                action="/artists/${artist.id}/unsubscribe"
                method="post"
              >
                <button>
                  Yes
                </button>
              </form>

              <form method="dialog" style="display: inline; margin-right: 8px">
                <button>No</button>
              </form>
            </dialog>

            <button
              style="display: inline; margin-right: 8px"
              onclick="getElementById('dialog-${artist.id}').show()"
            >
              Unsubscribe ⨯?
            </button>
          </div>
        </section>
      `,
    )
  }
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () =>
      html`
      <style>
        #header-actions button, #header-actions .button, #header-actions input, #header-actions select,
        .artist-actions .button,
        .artist-actions button {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
    `,
  ],
  Body: ArtistsIndexPage,
});
