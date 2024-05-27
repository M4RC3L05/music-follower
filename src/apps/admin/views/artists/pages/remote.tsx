import type { FC } from "@hono/hono/jsx";
import type { ItunesArtistSearchModel } from "#src/remote/mod.ts";

export const ArtistsRemotePage: FC<{
  remoteArtists: (ItunesArtistSearchModel & {
    image: string;
    isSubscribed: boolean;
  })[];
  q: string;
}> = ({
  remoteArtists,
  q,
}) => (
  <>
    <header>
      <nav>
        <a class="current" href="/">Home</a>
        <a href="/artists">Artists</a>
        <a href="/releases">Releases</a>
      </nav>

      <h1>Search artists to follow</h1>
    </header>

    <main>
      <section>
        <form
          id="search-remote-form"
          action="/artists/remote"
          method="get"
          class="text-align: center"
        >
          <div>
            <label for="q">Artists name</label>
            <input
              type="text"
              id="q"
              name="q"
              placeholder="Artists name"
              required
              value={q}
            />
          </div>

          <button type="submit">
            Search
          </button>
        </form>
      </section>

      {remoteArtists.length > 0
        ? (
          <section>
            {remoteArtists.map(
              (remoteArtist) => (
                <section style="overflow: auto;">
                  <aside>
                    <img
                      src={remoteArtist.image}
                      style="width: 100%; height: auto; aspect-ratio: 1 / 1"
                    />
                  </aside>

                  <h3 style="margin-top: 0px">{remoteArtist.artistName}</h3>

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

                    <button disabled={remoteArtist.isSubscribed}>
                      Subscribe
                    </button>
                  </form>
                </section>
              ),
            )}
          </section>
        )
        : undefined}
    </main>
  </>
);
