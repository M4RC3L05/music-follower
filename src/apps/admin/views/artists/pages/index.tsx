import type { FC } from "@hono/hono/jsx";
import type { Artist } from "#src/database/types/mod.ts";

type ArtistsIndexPageProps = {
  artists: Artist[];
  pagination: {
    currentUrl: string;
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
};

const ArtistSection: FC<{ artist: Artist }> = ({ artist }) => (
  <section style="overflow: auto;" class="clearfix">
    <aside>
      <img
        src={artist.imageUrl}
        style="width: 100%; height: auto; aspect-ratio: 1 / 1"
      />
    </aside>

    <h3 style="margin-top: 0">{artist.name}</h3>

    <div class="artist-actions">
      <dialog id={`dialog-${artist.id}`}>
        <p>Are you sure you want to unsubscribe from "{artist.name}"?</p>

        <form
          style="display: inline; margin-right: 8px"
          action={`/artists/${artist.id}/unsubscribe`}
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
        onclick={`getElementById("dialog-${artist.id}").show()`}
      >
        Unsubscribe ⨯?
      </button>
    </div>
  </section>
);

export const ArtistsIndexPage: FC<ArtistsIndexPageProps> = (
  { artists, pagination },
) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
        <a class="current" href="/artists">Artists</a>
        <a href="/releases">Releases</a>
      </nav>

      <h1>Artists</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; padding: 8px 0px; z-index: 2"
    >
      <form
        id="header-actions"
        style="display: flex; align-items: center; justify-content: center; margin-left: 8px; margin-right: 8px"
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
        <input
          style="margin-right: 8px"
          type="text"
          name="q"
          placeholder="Search subscribed artists"
          value={new URL(pagination.currentUrl).searchParams.has("q")
            ? new URL(pagination.currentUrl).searchParams.get("q")!
            : ""}
        />

        <button type="submit">
          Search
        </button>
      </form>

      <a href="/artists/remote" class="button" style="margin-right: 8px">
        Find artists
      </a>
      <a href="/artists/import" class="button" style="margin-right: 8px">
        Import ↥
      </a>
      <a href="/artists/export" target="_blank" class="button">Export ↧</a>

      <br />

      <a class="button" style="margin-right: 8px" href={pagination.startLink}>
        « Start
      </a>
      <a
        class="button"
        style="margin-right: 8px"
        href={pagination.previousLink}
      >
        ← Previous
      </a>
      <a class="button" style="margin-right: 8px" href={pagination.nextLink}>
        Next →
      </a>
      <a class="button" href={pagination.endLink}>End »</a>
    </header>

    <main>
      {artists.map((artist) => <ArtistSection artist={artist} />)}
    </main>
  </>
);
