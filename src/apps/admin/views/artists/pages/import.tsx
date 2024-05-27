import type { FC } from "@hono/hono/jsx";

export const ArtistsImportPage: FC = () => (
  <>
    <header>
      <nav>
        <a class="current" href="/">Home</a>
        <a href="/artists">Artists</a>
        <a href="/releases">Releases</a>
      </nav>

      <h1>Artists</h1>
    </header>

    <main>
      <form
        action="/artists/import"
        method="post"
        class="text-align: center"
        enctype="multipart/form-data"
      >
        <div>
          <label for="file">Artists file</label>
          <input
            type="file"
            id="file"
            name="file"
            placeholder="Artists file"
            required
          />
        </div>

        <button type="submit">
          Import
        </button>
      </form>
    </main>
  </>
);
