import { html, raw } from "hono/html";
import { Release } from "#src/database/mod.js";
import { layouts } from "../../common/mod.js";
import { Navbar } from "../../common/partials/mod.js";

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

const ReleasesIndexPage = ({ releases, pagination }: ReleasesIndexPage) => html`
  <header>
    ${Navbar()}

    <h1>Releases</h1>
  </header>

  <header style="position: sticky; top: 0; padding: 8px 0px; z-index: 2">
    <form
      id="header-actions"
      action="${new URL(pagination.currentUrl).pathname}"
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
      <input type="text" name="q" placeholder="Search release" value="${
        new URL(pagination.currentUrl).searchParams.has("q")
          ? new URL(pagination.currentUrl).searchParams.get("q")
          : ""
      }" />

      <select name="hidden">
        <option value="">Filter hidden mode</option>
        <option
          value="admin"
          ${
            new URL(pagination.currentUrl).searchParams.get("hidden") ===
            "admin"
              ? `${raw("selected")}`
              : ""
          }
        >
          Admin
        </option>
        <option
          value="feed"
          ${
            new URL(pagination.currentUrl).searchParams.get("hidden") === "feed"
              ? `${raw("selected")}`
              : ""
          }
        >
          Feed
        </option>
      </select>

      <button type="submit">
        Search
      </button>
    </form>

    <a class="button" href=${pagination.startLink}>« Start</a>
    <a class="button" href=${pagination.previousLink}>← Previous</a>
    <a class="button" href=${pagination.nextLink}>Next →</a>
    <a class="button" href=${pagination.endLink}>End »</a>
  </header>

  <main>
    ${releases.map(
      (release) => html`
      <section style="box-sizing: border-box">
        <aside>
          <img src=${release.coverUrl} style="width: 100%; height: auto; aspect-ratio: 1 / 1" />
        </aside>

        ${
          new Date(release.releasedAt).getTime() > Date.now()
            ? html`<mark>To be released</mark>`
            : html``
        }
        <mark>${release.type}</mark>

        <h3>${release.name} by ${release.artistName}</h3>
        <p>Released at ${new Date(release.releasedAt).toLocaleString()}</p>

        <a href=${`/releases/show?id=${release.id}&type=${release.type}`}>More</a>
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
  Body: ReleasesIndexPage,
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
  ],
});
