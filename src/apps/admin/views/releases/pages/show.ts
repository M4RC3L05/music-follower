import { html } from "hono/html";
import { Release } from "#src/database/mod.ts";
import { layouts } from "../../common/mod.ts";
import { Navbar } from "../../common/partials/mod.ts";

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
      hx-patch="/releases/state"
      hx-on::after-on-load="onHideAdminStatePatch(this)"
      hx-swap="none"
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
      style="margin-right: 4px"
      hx-patch="/releases/state"
      hx-on::after-on-load="onHideFeedStatePatch(this)"
      hx-swap="none"
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
        #header-actions button,.button {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
        }
      </style>
    `,
  ],
  Scripts: [
    () =>
      html`
      <script type="module">
        const onHideAdminStatePatch = (form) => {
          const state = form.querySelector("input[name='state']").value;
          form.querySelector("input[name='state']").value = state === "hide" ? "show" : "hide";
          form.querySelector("button[type='submit']").textContent = (state === "show" ? "Hidden Admin ☑" : "Hidden Admin ☐");
        }

        const onHideFeedStatePatch = (form) => {
          const state = form.querySelector("input[name='state']").value;
          form.querySelector("input[name='state']").value = state === "hide" ? "show" : "hide";
          form.querySelector("button[type='submit']").textContent = (state === "show" ? "Hidden Feed ☑" : "Hidden Feed ☐");
        }

        window.onHideAdminStatePatch = onHideAdminStatePatch;
        window.onHideFeedStatePatch = onHideFeedStatePatch;
      </script>
    `,
    () => html`<script src="/deps/htmx.org/dist/htmx.min.ts"></script>`,
  ],
  Body: ReleasesShowPage,
});
