import { html } from "hono/html";
import type { Release } from "#src/database/types/mod.ts";
import { layouts } from "#src/apps/admin/views/common/mod.ts";
import { Navbar } from "#src/apps/admin/views/common/partials/mod.ts";

type ReleasesShowPage = {
  release: Release;
};

const ReleasesShowPage = ({ release }: ReleasesShowPage) =>
  html`
  <header>
    ${Navbar()}

    <h1>Release ${release.id}@${release.type}</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; padding: 8px 0px; display: flex; justify-content: center; z-index:2">
    <form
      action="/releases/${release.id}/${release.type}/state"
      method="post"
      style="margin-right: 8px"
    >
      <input type="hidden" name="id" value=${release.id} />
      <input type="hidden" name="type" value=${release.type} />
      <input type="hidden" name="option" value="admin" />
      <input type="hidden" name="state" value=${
    release.hidden.includes("admin") ? "hide" : "show"
  } />
      <button type="submit">
        Hidden Admin ${release.hidden.includes("admin") ? "☑" : "☐"}
      </button>
    </form>

    <form
      action="/releases/${release.id}/${release.type}/state"
      method="post"
    >
      <input type="hidden" name="id" value=${release.id} />
      <input type="hidden" name="type" value=${release.type} />
      <input type="hidden" name="option" value="feed" />
      <input type="hidden" name="state" value=${
    release.hidden.includes("feed") ? "hide" : "show"
  } />
      <button type="submit">
        Hidden Feed ${release.hidden.includes("feed") ? "☑" : "☐"}
      </button>
    </form>
  </header>

  <main>
    <div style="display: flex; justify-content: center">
      <img src=${release.coverUrl} />
    </div>

    <h3>${release.name} by ${release.artistName}</h3>

    ${
    new Date(release.releasedAt).getTime() > Date.now()
      ? html`<mark>To be released</mark>`
      : html``
  }
    <mark>${release.type}</mark>

    <p>
      Release date ${new Date(release?.releasedAt ?? "").toLocaleString()}
    </p>

    ${
    typeof (JSON.parse(release?.metadata ?? "{}") as Record<string, unknown>)
        ?.previewUrl === "string"
      ? html`
          <audio
            style="width: 100%"
            src=${(JSON.parse(release?.metadata ?? "{}") as Record<
        string,
        unknown
      >)
        .previewUrl as string}
            controls
          ></audio>
        `
      : html``
  }

    <p>Metadata:</p>
    <pre>
      ${JSON.stringify(JSON.parse(release.metadata ?? "{}"), null, 2)}
    </pre>
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () =>
      html`
      <style>
        #header-actions button, #header-actions.button {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
    `,
  ],
  Body: ReleasesShowPage,
});
