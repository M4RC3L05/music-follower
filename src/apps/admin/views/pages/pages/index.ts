import { html } from "hono/html";
import { layouts } from "../../common/mod.js";
import { Navbar } from "../../common/partials/mod.js";

const CategoriesCreatePage = () => html`
  <header>
    ${Navbar()}
  </header>

  <main>
    <h1>Welcome to music follower admin</h1>
    <p>See your releases and manage your artists</p>
  </main>
`;

export default layouts.MainLayout({
  Body: CategoriesCreatePage,
});
