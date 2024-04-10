import { html } from "hono/html";
import type { ItunesArtistSearchModel } from "#src/remote/mod.ts";
import { layouts } from "#src/apps/admin/views/common/mod.ts";
import { Navbar } from "#src/apps/admin/views/common/partials/mod.ts";

const ArtistsRemotePage = ({
  remoteArtists,
  q,
}: {
  remoteArtists: (ItunesArtistSearchModel & {
    image: string;
    isSubscribed: boolean;
  })[];
  q: string;
}) =>
  html`
  <header>
    ${Navbar()}

    <h1>Search artists to follow</h1>
  </header>

  <main>
    <section>
      <form id="search-remote-form" action="/artists/remote" method="get" class="text-align: center">
        <div>
          <label for="q">Artists name</label>
          <input type="text" id="q" name="q" placeholder="Artists name" required value="${q}" />
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
              ${
        remoteArtists.map(
          (remoteArtist) =>
            html`
                <section style="overflow: auto;">
                  <aside>
                    <img src="${remoteArtist.image}" style="width: 100%; height: auto; aspect-ratio: 1 / 1" />
                  </aside>

                  <h3 style="margin-top: 0px">${remoteArtist.artistName}</h3>

                  <form
                    action="/artists/remote"
                    method="post"
                  >
                    <input type="hidden" name="name" value="${remoteArtist.artistName}" />
                    <input type="hidden" name="id" value="${remoteArtist.artistId}" />
                    <input type="hidden" name="image" value="${remoteArtist.image}" />

                    <button ${remoteArtist.isSubscribed ? "disabled" : ""}>
                      Subscribe
                    </button>
                  </form>
                </section>
              `,
        )
      }
            </section>
          `
      : null
  }
  </main>
`;

export default layouts.MainLayout({
  Body: ArtistsRemotePage,
});
