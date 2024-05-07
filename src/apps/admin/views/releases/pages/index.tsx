import type { FC } from "hono/jsx";
import type { Release } from "#src/database/types/mod.ts";

type ReleasesIndexPage = {
  releases: Release[];
  pagination: {
    currentUrl: string;
    previousLink: string;
    startLink: string;
    endLink: string;
    nextLink: string;
  };
};

export const ReleasesIndexPage: FC<ReleasesIndexPage> = (
  { releases, pagination },
) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/artists">Artists</a>
        <a class="current" href="/releases">Releases</a>
      </nav>

      <h1>Releases</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; padding: 8px 0px; z-index: 2"
    >
      <form
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
          placeholder="Search release"
          value={new URL(pagination.currentUrl).searchParams.has("q")
            ? new URL(pagination.currentUrl).searchParams.get("q")!
            : ""}
        />

        <select name="hidden" style="margin-right: 8px">
          <option value="">Filter hidden mode</option>
          <option
            value="admin"
            selected={new URL(pagination.currentUrl).searchParams.get(
              "hidden",
            ) ===
              "admin"}
          >
            Admin
          </option>
          <option
            value="feed"
            selected={new URL(pagination.currentUrl).searchParams.get(
              "hidden",
            ) === "feed"}
          >
            Feed
          </option>
        </select>

        <button type="submit">
          Search
        </button>
      </form>

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
      {releases.map(
        (release) => (
          <section
            style="overflow: auto"
            class="clearfix"
          >
            <aside>
              <img
                src={release.coverUrl}
                style="width: 100%; height: auto; aspect-ratio: 1 / 1"
              />
            </aside>

            {new Date(release.releasedAt).getTime() > Date.now()
              ? <mark style="margin-right: 8px">To be released</mark>
              : undefined}
            <mark>{release.type}</mark>

            <h3>{release.name} by {release.artistName}</h3>
            <p>Released at {new Date(release.releasedAt).toLocaleString()}</p>

            <a href={`/releases/${release.id}/${release.type}`}>More</a>
          </section>
        ),
      )}
    </main>
  </>
);
