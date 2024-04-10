import { html } from "hono/html";
import { layouts } from "../../common/mod.ts";
import { Navbar } from "../../common/partials/mod.ts";

const ArtistsImportPage = () =>
  html`
  <header>
    ${Navbar()}

    <h1>Artists</h1>
  </header>

  <main>
    <form action="/artists/import" method="post" class="text-align: center" enctype="multipart/form-data">
      <div>
        <label for="file">Artists file</label>
        <input type="file" id="file" name="file" placeholder="Artists file" required />
      </div>

      <button type="submit">
        Import
      </button>
    </form>
  </main>
`;

export default layouts.MainLayout({
  Body: ArtistsImportPage,
});
